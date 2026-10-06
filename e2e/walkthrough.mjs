// Browser walkthrough of the whole app: landing animations, the four demo
// flows by real clicks, vendor/admin pages, and mobile layout. Fails on any
// console error, page error, or 4xx/5xx API response.
//
// Needs the app running (`npm run dev`) on a freshly seeded database
// (`npm run seed`); it places orders and adds products as it goes.
//   E2E_URL      app URL                    (default http://localhost:5173)
//   E2E_BROWSER  installed browser channel  (default msedge; or chrome)
//   E2E_PASSWORD / E2E_ADMIN_PASSWORD  seeded account passwords (default Demo@1234)
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const APP = (process.env.E2E_URL || 'http://localhost:5173').replace(/\/$/, '');
const DEMO_PASSWORD = process.env.E2E_PASSWORD || 'Demo@1234';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || DEMO_PASSWORD;
const SHOTS = path.join(path.dirname(fileURLToPath(import.meta.url)), 'screenshots');
mkdirSync(SHOTS, { recursive: true });
const results = [];
const problems = [];

const browser = await chromium.launch({ channel: process.env.E2E_BROWSER || 'msedge', headless: true });

function watch(page, label) {
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`[${label}] console: ${m.text().slice(0, 200)}`);
  });
  page.on('pageerror', (e) => problems.push(`[${label}] pageerror: ${e.message.slice(0, 200)}`));
  page.on('response', (r) => {
    if (r.url().includes('/api/') && r.status() >= 400) problems.push(`[${label}] API ${r.status()} ${r.request().method()} ${r.url().replace(APP, '')}`);
  });
}

async function newPage(label, viewport = { width: 1440, height: 900 }) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  watch(page, label);
  return page;
}

async function step(name, fn) {
  try {
    await fn();
    results.push(`PASS  ${name}`);
  } catch (e) {
    results.push(`FAIL  ${name}  -> ${e.message.split('\n')[0].slice(0, 220)}`);
  }
}

const shot = (page, name, fullPage = false) => page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage });

async function login(page, email) {
  await page.goto(`${APP}/login`);
  await page.locator('input[type=email]').fill(email);
  const password = email.startsWith('admin@') ? ADMIN_PASSWORD : DEMO_PASSWORD;
  await page.locator('input[type=password]').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL(/\/(retailer|vendor|admin)/, { timeout: 10000 });
}

async function scrollThrough(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(900);
}

// ---------------- Landing page
const landing = await newPage('landing');
await step('landing renders hero', async () => {
  await landing.goto(APP);
  await landing.getByRole('heading', { level: 1 }).waitFor();
  await landing.waitForTimeout(1000);
  await shot(landing, '01-landing-hero');
});
await step('landing: every scroll-reveal element becomes visible after scrolling', async () => {
  await scrollThrough(landing);
  const hidden = await landing.evaluate(
    () => [...document.querySelectorAll('.reveal, .reveal-scale, .reveal-left, .reveal-right')].filter((el) => !el.classList.contains('is-visible')).length
  );
  const total = await landing.evaluate(() => document.querySelectorAll('.reveal, .reveal-scale, .reveal-left, .reveal-right').length);
  if (hidden > 0) throw new Error(`${hidden}/${total} reveal elements never became visible`);
  const counters = await landing.evaluate(() =>
    [...document.querySelectorAll('section .text-5xl')].map((el) => el.textContent.trim())
  );
  if (counters.join() !== '41,0,8') throw new Error(`animated counters ended at ${counters.join()}`);
  await landing.evaluate(() => window.scrollTo(0, 0));
  await shot(landing, '02-landing-full', true);
});

const mobileLanding = await newPage('landing-mobile', { width: 390, height: 844 });
await step('landing mobile: no horizontal overflow', async () => {
  await mobileLanding.goto(APP);
  await scrollThrough(mobileLanding);
  const overflow = await mobileLanding.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 1) throw new Error(`page is ${overflow}px wider than the viewport`);
  await mobileLanding.evaluate(() => window.scrollTo(0, 0));
  await shot(mobileLanding, '03-landing-mobile');
});

// ---------------- Flow 1 (retailer side)
const retailer = await newPage('retailer');
await step('login as retailer -> dashboard', async () => {
  await login(retailer, 'retailer1@rurify.demo');
  await retailer.getByText('Connected suppliers').waitFor();
  await retailer.getByText('Still unavailable nearby').waitFor();
  await retailer.getByText('New product listed').first().waitFor();
  await shot(retailer, '04-retailer-dashboard');
});
await step('flow 1: search avocado shows suppliers', async () => {
  await retailer.goto(`${APP}/retailer/search`);
  await retailer.getByPlaceholder(/Try Avocado/).fill('avocado');
  await retailer.getByRole('button', { name: 'Search', exact: true }).click();
  await retailer.waitForFunction(
    () => [...document.querySelectorAll('h3')].filter((h) => h.closest('main')).map((h) => h.textContent).join() === 'Avocado'
  );
  await retailer.getByText('2 suppliers nearby').waitFor();
  await retailer.waitForTimeout(2000); // a stale earlier response must not replace these results
  const shown = await retailer.evaluate(() =>
    [...document.querySelectorAll('main h3')].map((h) => h.textContent).join()
  );
  if (shown !== 'Avocado') throw new Error(`results were overwritten: ${shown.slice(0, 80)}`);
  await shot(retailer, '05-search-avocado');
  await retailer.getByRole('button', { name: 'View suppliers' }).click();
  await retailer.getByRole('heading', { name: 'Deccan Produce Distributors' }).waitFor();
  await shot(retailer, '06-avocado-suppliers');
});
await step('flow 1: filters narrow suppliers (max 15km leaves 1)', async () => {
  await retailer.locator('form input[type=number]').nth(1).fill('15');
  await retailer.getByRole('button', { name: 'Apply' }).click();
  await retailer.getByRole('heading', { name: 'Deccan Produce Distributors' }).waitFor({ state: 'detached' });
  await retailer.getByRole('heading', { name: 'Pune Fresh Wholesale' }).waitFor();
  await retailer.getByRole('button', { name: 'Clear', exact: true }).click();
  await retailer.getByRole('heading', { name: 'Deccan Produce Distributors' }).waitFor();
});
await step('flow 1: order 10kg from Supplier B', async () => {
  const card = retailer.locator('div.rounded-2xl', { has: retailer.getByRole('heading', { name: 'Deccan Produce Distributors' }) });
  await card.getByRole('button', { name: 'Order', exact: true }).click();
  await card.locator('input[type=number]').fill('10');
  await card.getByRole('button', { name: 'Confirm' }).click();
  await retailer.waitForURL(/\/retailer\/orders/);
  await retailer.getByText('Deccan Produce Distributors').first().waitFor();
  await shot(retailer, '07-retailer-orders-pending');
});

// ---------------- Flow 1 (vendor side)
const vendor2 = await newPage('vendor2');
await step('flow 1: vendor B sees the order and accepts', async () => {
  await login(vendor2, 'vendor2@rurify.demo');
  await vendor2.goto(`${APP}/vendor/orders`);
  const card = vendor2.locator('div.rounded-2xl').filter({ hasText: 'Shree Kirana Store' }).filter({ hasText: '10 kg' }).first();
  await card.getByRole('button', { name: 'ACCEPTED' }).click();
  await card.getByText('ACCEPTED').first().waitFor();
  await shot(vendor2, '08-vendor-accepts');
});
await step('flow 1: retailer now sees ACCEPTED', async () => {
  await retailer.reload();
  const card = retailer.locator('div.rounded-2xl').filter({ hasText: 'Deccan Produce Distributors' }).first();
  await card.getByText('ACCEPTED').waitFor();
});

// ---------------- Flow 2
await step('flow 2: celery unavailable -> raise requirement', async () => {
  await retailer.goto(`${APP}/retailer/search?q=celery`);
  await retailer.getByText('Unavailable nearby').waitFor();
  await shot(retailer, '09-celery-unavailable');
  await retailer.getByRole('button', { name: 'Raise requirement' }).click();
  await retailer.waitForURL(/requirements\/new/);
  await retailer.locator('input[type=number]').first().fill('5');
  await retailer.locator('input[type=date]').fill('2026-10-09');
  await shot(retailer, '10-requirement-form');
  await retailer.getByRole('button', { name: 'Submit requirement' }).click();
  await retailer.waitForURL(/\/retailer\/requirements$/);
  await retailer.getByRole('heading', { name: /Celery/ }).first().waitFor();
});

const vendor1 = await newPage('vendor1');
await step('flow 2: vendor sees aggregated celery demand + alert', async () => {
  await login(vendor1, 'vendor1@rurify.demo');
  await shot(vendor1, '11-vendor-dashboard');
  await vendor1.goto(`${APP}/vendor/requirements`);
  await vendor1.getByText(/Celery: 8 retailers requesting · 47 kg total · 0 kg nearby stock/).waitFor();
  const reqCard = vendor1.locator('div.rounded-2xl').filter({ hasText: 'Shree Kirana Store' }).filter({ hasText: '5 kg needed' }).first();
  await reqCard.getByRole('button', { name: 'Can stock' }).click();
  await reqCard.getByText('You responded:').waitFor();
  await shot(vendor1, '12-vendor-requirements');
  await vendor1.goto(`${APP}/vendor/notifications`);
  await vendor1.getByText('Demand alert: Celery').waitFor();
  await shot(vendor1, '13-vendor-notifications');
});

// ---------------- Flow 3 (retailer dashboard open while vendor edits)
await step('flow 3: vendor adds Japanese Cucumber, retailer dashboard shows it without refresh', async () => {
  await retailer.goto(`${APP}/retailer`);
  await retailer.getByText('Connected suppliers').waitFor();
  await retailer.waitForTimeout(1500); // let the first (baseline) sync tick happen

  await vendor1.goto(`${APP}/vendor/inventory`);
  await vendor1.getByRole('button', { name: 'Add product' }).click();
  const modal = vendor1.locator('div.fixed').filter({ hasText: 'Add product' }).last();
  const inputs = modal.locator('input');
  await inputs.nth(0).fill('Cucumber');
  await inputs.nth(1).fill('Japanese');
  await modal.locator('select').first().selectOption({ label: 'Vegetables' });
  await inputs.nth(3).fill('30');
  await inputs.nth(4).fill('120');
  await inputs.nth(5).fill('2');
  await shot(vendor1, '14-add-product-modal');
  await modal.getByRole('button', { name: 'Add product' }).click();
  await vendor1.getByText('Cucumber — Japanese').waitFor();
  await shot(vendor1, '15-vendor-inventory');

  await retailer.getByText(/New product listed: Cucumber/).waitFor({ timeout: 15000 });
  await shot(retailer, '16-retailer-sync-toast');
});
await step('flow 3: quantity + price edits reach the retailer', async () => {
  const row = vendor1.locator('tr').filter({ hasText: 'Cucumber — Japanese' });
  await row.getByRole('button', { name: 'Edit' }).click();
  const modal = vendor1.locator('div.fixed').filter({ hasText: 'Save changes' }).last();
  await modal.locator('input[type=number]').nth(0).fill('12');
  await modal.locator('input[type=number]').nth(1).fill('135');
  await modal.getByRole('button', { name: 'Save changes' }).click();
  await row.getByText('12 kg').waitFor();
  await retailer.getByText(/Stock updated: Cucumber/).waitFor({ timeout: 15000 });

  await retailer.goto(`${APP}/retailer/search?q=cucumber`);
  await retailer.getByRole('button', { name: 'View suppliers' }).click();
  await retailer.getByText(/12 kg available · ₹135\/kg/).waitFor();
  await shot(retailer, '17-retailer-sees-new-qty-price');
});

// ---------------- Flow 4
await step('flow 4: demand intelligence chart + table', async () => {
  await vendor1.goto(`${APP}/vendor/demand`);
  await vendor1.locator('.recharts-bar-rectangle').first().waitFor();
  const names = await vendor1.locator('tbody tr td:first-child').allTextContents();
  if (names.slice(0, 5).join() !== 'Kiwi,Avocado,Oregano,Celery,Zucchini') throw new Error(`top 5 = ${names.slice(0, 5).join()}`);
  await shot(vendor1, '18-demand-intelligence', true);
});
await step('flow 4: Kiwi HIGH PRIORITY FOR STOCKING', async () => {
  await vendor1.goto(`${APP}/vendor/recommendations`);
  const card = vendor1.locator('div.rounded-2xl').filter({ hasText: 'Kiwi' }).first();
  await card.getByText('HIGH PRIORITY FOR STOCKING').waitFor();
  await shot(vendor1, '19-recommendations');
});

// ---------------- Admin
const admin = await newPage('admin');
await step('admin dashboard', async () => {
  await login(admin, 'admin@rurify.demo');
  await admin.getByText('Platform overview').waitFor();
  await shot(admin, '20-admin-dashboard');
});
await step('admin regional map renders 5 region markers', async () => {
  await admin.goto(`${APP}/admin/regional`);
  await admin.locator('.leaflet-container').waitFor();
  await admin.waitForTimeout(2500);
  const markers = await admin.locator('path.leaflet-interactive').count();
  if (markers !== 5) throw new Error(`${markers} markers`);
  const outside = await admin.evaluate(() => {
    const box = document.querySelector('.leaflet-container').getBoundingClientRect();
    return [...document.querySelectorAll('path.leaflet-interactive')].filter((p) => {
      const r = p.getBoundingClientRect();
      const cx = r.x + r.width / 2;
      const cy = r.y + r.height / 2;
      return cx < box.left || cx > box.right || cy < box.top || cy > box.bottom;
    }).length;
  });
  if (outside) throw new Error(`${outside} region marker(s) outside the visible map`);
  await shot(admin, '21-admin-regional-map');
});
await step('admin settings, audit logs, demand analytics, users render', async () => {
  for (const [p, text, name] of [
    ['/admin/settings', 'Supplier match score weights', '22-admin-settings'],
    ['/admin/audit-logs', 'INVENTORY_CREATE', '23-admin-audit'],
    ['/admin/demand', 'Supply gaps', '24-admin-demand'],
    ['/admin/users', 'retailer1@rurify.demo', '25-admin-users'],
  ]) {
    await admin.goto(APP + p);
    await admin.getByText(text).first().waitFor();
    await shot(admin, name);
  }
});

// ---------------- Mobile dashboard + role guard
const mobile = await newPage('retailer-mobile', { width: 390, height: 844 });
await step('retailer dashboard on mobile: bottom nav, no overflow', async () => {
  await login(mobile, 'retailer1@rurify.demo');
  await mobile.getByText('Connected suppliers').waitFor();
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 1) throw new Error(`page is ${overflow}px wider than the viewport`);
  const navBottom = await mobile.evaluate(() => {
    const nav = [...document.querySelectorAll('nav')].find((n) => getComputedStyle(n).position === 'fixed');
    return nav ? Math.round(nav.getBoundingClientRect().bottom) : null;
  });
  if (navBottom !== 844) throw new Error(`bottom nav not pinned to viewport (bottom=${navBottom})`);
  await shot(mobile, '26-retailer-mobile');
});
await step('mobile: "More" menu reaches every page and Log out', async () => {
  await mobile.getByRole('button', { name: 'More' }).click();
  await mobile.getByRole('link', { name: /Profile/ }).click();
  await mobile.getByRole('button', { name: 'Log out' }).waitFor({ state: 'hidden' });
  await mobile.waitForURL(/\/retailer\/profile/);
  await mobile.getByRole('heading', { name: 'Profile' }).waitFor();
  await mobile.getByRole('button', { name: 'Menu' }).click();
  await shot(mobile, '27-mobile-menu');
  await mobile.getByRole('button', { name: 'Log out' }).click();
  await mobile.waitForURL(/\/login/);
});
await step('mobile vendor: demand page usable at phone width', async () => {
  await login(mobile, 'vendor1@rurify.demo');
  await mobile.goto(`${APP}/vendor/demand`);
  await mobile.locator('.recharts-bar-rectangle').first().waitFor();
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 1) throw new Error(`page is ${overflow}px wider than the viewport`);
  await shot(mobile, '28-mobile-demand');
});
await step('retailer visiting /admin is redirected away', async () => {
  await mobile.goto(`${APP}/admin`);
  await mobile.waitForTimeout(800);
  if (mobile.url().includes('/admin')) throw new Error(`still on ${mobile.url()}`);
});

await browser.close();
console.log(results.join('\n'));
console.log(`\n${results.filter((r) => r.startsWith('FAIL')).length} failed of ${results.length}`);
console.log('\nProblems observed:\n' + (problems.length ? [...new Set(problems)].join('\n') : '(none)'));
console.log(`\nScreenshots: ${SHOTS}`);
process.exit(results.some((r) => r.startsWith('FAIL')) || problems.length ? 1 : 0);
