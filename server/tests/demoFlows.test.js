/* eslint-disable no-console */
// End-to-end API tests for the four required demo flows, plus role isolation,
// demand alerts, and CSV import. Runs against an isolated SQLite file.
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = './database/test.sqlite';
process.env.NODE_ENV = 'test';
// Pin test credentials so a customized server/.env doesn't affect the suite
process.env.SEED_DEMO_PASSWORD = 'Demo@1234';
process.env.SEED_ADMIN_PASSWORD = 'Demo@1234';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { seed } = require('../database/seed');
const app = require('../app');
const { sequelize } = require('../models');

let server;
let BASE;

async function call(method, path, token, body, isForm = false) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  if (body && !isForm) headers['Content-Type'] = 'application/json';
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

const login = async (email) =>
  (await call('POST', '/auth/login', null, { email, password: 'Demo@1234' })).json.data.token;

let retailer;
let vendor1;
let vendor2;
let admin;

before(async () => {
  const log = console.log;
  console.log = () => {};
  try {
    await seed();
  } finally {
    console.log = log;
  }
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  BASE = `http://127.0.0.1:${server.address().port}/api`;
  [retailer, vendor1, vendor2, admin] = await Promise.all([
    login('retailer1@rurify.demo'),
    login('vendor1@rurify.demo'),
    login('vendor2@rurify.demo'),
    login('admin@rurify.demo'),
  ]);
});

after(async () => {
  server?.close();
  await sequelize.close();
});

test('flow 4 (seed state): top-5 demand ranking and Kiwi HIGH PRIORITY recommendation', async () => {
  const top = await call('GET', '/demand/top-products?limit=5', vendor1);
  assert.deepEqual(
    top.json.data.map((p) => p.name),
    ['Kiwi', 'Avocado', 'Oregano', 'Celery', 'Zucchini']
  );
  assert.equal(top.json.data[0].classification, 'VERY_HIGH');

  const recs = await call('GET', '/recommendations', vendor1);
  const kiwi = recs.json.data.find((r) => r.productName === 'Kiwi');
  assert.equal(kiwi?.priority, 'HIGH_PRIORITY');
  assert.match(kiwi.reason, /no nearby availability/);

  const oregano = recs.json.data.find((r) => r.productName === 'Oregano');
  assert.equal(oregano?.priority, 'CONSIDER_INCREASING');
});

test('flow 1: avocado search, ranked suppliers, order from Supplier B, vendor accepts', async () => {
  const search = await call('GET', '/products/search?q=avocado', retailer);
  const avocado = search.json.data[0];
  assert.equal(avocado.supplierCount, 2);

  const sup = await call('GET', `/products/${avocado.product.id}/suppliers`, retailer);
  const suppliers = sup.json.data.suppliers;
  assert.ok(suppliers[0].matchScore >= suppliers[1].matchScore);
  const a = suppliers.find((s) => s.vendorName === 'Pune Fresh Wholesale');
  const b = suppliers.find((s) => s.vendorName === 'Deccan Produce Distributors');
  assert.equal(Math.round(a.distanceKm), 12);
  assert.equal(Math.round(b.distanceKm), 21);
  assert.equal(a.price, 280);
  assert.equal(b.price, 260);

  const order = await call('POST', '/orders', retailer, { inventoryId: b.inventoryId, quantity: 10 });
  assert.equal(order.status, 201);

  const vendorOrders = await call('GET', '/orders', vendor2);
  const seen = vendorOrders.json.data.find((o) => o.id === order.json.data.id);
  assert.equal(seen.status, 'PENDING');
  assert.equal(seen.quantity, 10);

  const accept = await call('PUT', `/orders/${order.json.data.id}/status`, vendor2, { status: 'ACCEPTED' });
  assert.equal(accept.status, 200);

  const mine = await call('GET', '/orders', retailer);
  assert.equal(mine.json.data.find((o) => o.id === order.json.data.id).status, 'ACCEPTED');

  const retailerNotes = await call('GET', '/notifications', retailer);
  assert.ok(retailerNotes.json.data.some((n) => n.type === 'ORDER_STATUS' && n.relatedEntityId === order.json.data.id));
});

test('flow 1 edge cases: MOQ, stock, invalid transitions, cross-vendor access', async () => {
  const sup = await call('GET', '/products/1/suppliers', retailer);
  const b = sup.json.data.suppliers.find((s) => s.vendorName === 'Deccan Produce Distributors');

  assert.equal((await call('POST', '/orders', retailer, { inventoryId: b.inventoryId, quantity: 2 })).status, 400);
  assert.equal((await call('POST', '/orders', retailer, { inventoryId: b.inventoryId, quantity: 9999 })).status, 400);
  assert.equal((await call('POST', '/orders', retailer, { inventoryId: b.inventoryId, quantity: -1 })).status, 400);

  const order = await call('POST', '/orders', retailer, { inventoryId: b.inventoryId, quantity: 10 });
  const id = order.json.data.id;
  assert.equal((await call('PUT', `/orders/${id}/status`, vendor2, { status: 'COMPLETED' })).status, 400);
  assert.equal((await call('PUT', `/orders/${id}/status`, vendor1, { status: 'ACCEPTED' })).status, 403);
  assert.equal((await call('PUT', `/orders/${id}/status`, retailer, { status: 'ACCEPTED' })).status, 403);
  assert.equal((await call('PUT', `/orders/${id}/status`, retailer, { status: 'CANCELLED' })).status, 200);
});

test('flow 2: celery unavailable -> requirement -> vendor sees aggregate and demand alert', async () => {
  const search = await call('GET', '/products/search?q=celery', retailer);
  const celery = search.json.data[0];
  assert.equal(celery.available, false);

  const aggBefore = await call('GET', `/requirements/aggregate/${celery.product.id}`, vendor1);
  assert.equal(aggBefore.json.data.retailersRequesting, 8);
  assert.equal(aggBefore.json.data.totalRequestedQty, 42);
  assert.equal(aggBefore.json.data.nearbyStock, 0);
  assert.equal(aggBefore.json.data.demandClassification, 'VERY_HIGH');

  const req = await call('POST', '/requirements', retailer, {
    productId: celery.product.id,
    requiredQty: 5,
    requiredDate: '2026-10-09',
  });
  assert.equal(req.status, 201);

  const aggAfter = await call('GET', `/requirements/aggregate/${celery.product.id}`, vendor1);
  assert.equal(aggAfter.json.data.totalRequestedQty, 47);

  const vendorReqs = await call('GET', '/requirements', vendor1);
  assert.ok(vendorReqs.json.data.some((r) => r.id === req.json.data.id));

  const notes = await call('GET', '/notifications', vendor1);
  assert.ok(notes.json.data.some((n) => n.type === 'NEW_REQUIREMENT' && n.relatedEntityId === req.json.data.id));
  const alerts = notes.json.data.filter((n) => n.type === 'DEMAND_ALERT' && n.title.includes('Celery'));
  assert.equal(alerts.length, 1, 'demand alert is sent once per product per 24h');

  const respond = await call('PUT', `/requirements/${req.json.data.id}/respond`, vendor1, { response: 'CAN_STOCK' });
  assert.equal(respond.status, 200);
});

test('flow 3: new product, quantity and price changes reach the connected retailer', async () => {
  const since = new Date().toISOString();
  await new Promise((r) => setTimeout(r, 20));

  const cats = await call('GET', '/categories', vendor1);
  const veg = cats.json.data.find((c) => c.name === 'Vegetables');
  const created = await call('POST', '/inventory', vendor1, {
    productName: 'Cucumber',
    variety: 'Japanese',
    categoryId: veg.id,
    unit: 'kg',
    quantity: 30,
    price: 120,
    moq: 2,
    freshness: 'FRESH',
    deliveryAvailable: true,
  });
  assert.equal(created.status, 201);
  const invId = created.json.data.id;

  assert.equal((await call('PUT', `/inventory/${invId}`, vendor1, { quantity: 12 })).status, 200);
  assert.equal((await call('PUT', `/inventory/${invId}`, vendor1, { price: 135 })).status, 200);

  const feed = await call('GET', `/inventory/sync?since=${encodeURIComponent(since)}`, retailer);
  const fields = feed.json.data.map((f) => f.field);
  for (const f of ['created', 'quantity', 'price']) assert.ok(fields.includes(f), `feed has ${f}`);

  const notes = await call('GET', '/notifications', retailer);
  assert.ok(notes.json.data.some((n) => n.type === 'NEW_PRODUCT' && n.message.includes('Cucumber')));

  const sup = await call('GET', `/products/${created.json.data.Product.id}/suppliers`, retailer);
  assert.equal(sup.json.data.suppliers[0].quantity, 12);
  assert.equal(sup.json.data.suppliers[0].price, 135);

  assert.equal((await call('PUT', `/inventory/${invId}`, vendor2, { quantity: 1 })).status, 403);
  assert.equal((await call('POST', '/inventory', vendor1, { ...created.json.data, productName: 'Cucumber', variety: 'Japanese', categoryId: veg.id, unit: 'kg', freshness: 'FRESH' })).status, 409);
});

test('blank optional form fields are accepted (as the add-product form sends them)', async () => {
  const res = await call('POST', '/inventory', vendor2, {
    productName: 'Leek',
    variety: '',
    categoryId: 2,
    unit: 'kg',
    quantity: 5,
    price: 80,
    moq: 1,
    freshness: 'FRESH',
    expiryDate: '',
    imageUrl: '',
    description: '',
    deliveryAvailable: true,
  });
  assert.equal(res.status, 201, JSON.stringify(res.json));

  const req = await call('POST', '/requirements', retailer, { productId: 2, requiredQty: 1, requiredDate: '', preferredPrice: '' });
  assert.equal(req.status, 201, JSON.stringify(req.json));
});

test('CSV import: valid rows import, bad rows and duplicates are reported', async () => {
  const csv = [
    'productName,category,variety,unit,quantity,price,moq,freshness,deliveryAvailable',
    'Kiwi,Fruits,,kg,40,300,2,FRESH,true',
    'Basil,Herbs,Italian,kg,8,380,1,GOOD,yes',
    'Kiwi,Fruits,,kg,10,310,2,FRESH,true',
    'Leek,Vegetables,,kg,abc,90,2,FRESH,true',
    'Shallot,Vegetables,,kg,10,90,2,STALE,true',
  ].join('\n');
  const form = new FormData();
  form.append('file', new Blob([csv], { type: 'text/csv' }), 'inventory.csv');

  const res = await call('POST', '/inventory/import', vendor1, form, true);
  assert.equal(res.status, 200);
  assert.deepEqual(res.json.data.summary, { totalRows: 5, success: 2, failed: 3 });
  const messages = res.json.data.errors.map((e) => e.message).join(' | ');
  assert.match(messages, /Duplicate/);
  assert.match(messages, /Invalid quantity/);
  assert.match(messages, /Invalid freshness/);

  const missing = new FormData();
  missing.append('file', new Blob(['productName,price\nKiwi,300'], { type: 'text/csv' }), 'bad.csv');
  const bad = await call('POST', '/inventory/import', vendor1, missing, true);
  assert.equal(bad.json.data.summary.success, 0);
  assert.match(bad.json.data.errors[0].message, /Missing required column/);

  const exe = new FormData();
  exe.append('file', new Blob(['MZ'], { type: 'application/octet-stream' }), 'evil.exe');
  assert.equal((await call('POST', '/inventory/import', vendor1, exe, true)).status, 400);
});

test('auth and role isolation', async () => {
  assert.equal((await call('POST', '/auth/login', null, { email: 'retailer1@rurify.demo', password: 'wrong-pass' })).status, 401);
  const dup = await call('POST', '/auth/register', null, {
    email: 'retailer1@rurify.demo',
    password: 'Password123',
    name: 'Dup',
    role: 'retailer',
    shopName: 'Dup',
    address: 'x',
    lat: 18.5,
    lng: 73.8,
    regionId: 1,
  });
  assert.equal(dup.status, 409);
  const adminSignup = await call('POST', '/auth/register', null, {
    email: 'sneaky@x.com',
    password: 'Password123',
    name: 'Sneaky',
    role: 'admin',
    address: 'x',
    lat: 1,
    lng: 1,
    regionId: 1,
  });
  assert.equal(adminSignup.status, 400, 'nobody can self-register as admin');

  assert.equal((await call('GET', '/orders')).status, 401);
  assert.equal((await call('GET', '/admin/users', retailer)).status, 403);
  assert.equal((await call('GET', '/admin/users', vendor1)).status, 403);
  assert.equal((await call('GET', '/inventory', retailer)).status, 403);
  assert.equal((await call('POST', '/orders', vendor1, { inventoryId: 1, quantity: 5 })).status, 403);
  assert.equal((await call('GET', '/admin/users', admin)).status, 200);

  const users = await call('GET', '/admin/users?role=retailer', admin);
  const target = users.json.data.find((u) => u.email === 'retailer20@rurify.demo');
  const token = await login('retailer20@rurify.demo');
  await call('PUT', `/admin/users/${target.id}/status`, admin, { isActive: false });
  assert.equal((await call('GET', '/orders', token)).status, 401, 'deactivated user is locked out immediately');
  assert.equal((await call('POST', '/auth/login', null, { email: 'retailer20@rurify.demo', password: 'Demo@1234' })).status, 403);
});

test('admin settings expose the live scoring config, admin-only', async () => {
  const res = await call('GET', '/admin/settings', admin);
  assert.equal(res.status, 200);
  const total = Object.values(res.json.data.matchScoreWeights).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(total - 1) < 1e-9, 'match weights sum to 1');
  assert.equal(res.json.data.demandScore.rawScoreCap, 150);
  assert.equal((await call('GET', '/admin/settings', vendor1)).status, 403);
});

test('regional demand differs by region', async () => {
  const regional = await call('GET', '/demand/regional', admin);
  const nashik = regional.json.data.find((r) => r.region.name === 'Nashik');
  assert.ok(nashik.topProducts.some((p) => p.name === 'Mozzarella'));
  const pune = regional.json.data.find((r) => r.region.name === 'Pune Rural');
  assert.ok(!pune.topProducts.some((p) => p.name === 'Mozzarella'));
});
