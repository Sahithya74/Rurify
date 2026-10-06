import { Link } from 'react-router-dom';
import Reveal from '../../components/ui/Reveal';
import AnimatedCounter from '../../components/ui/AnimatedCounter';

const HARD_TO_FIND = [
  'Avocado', 'Kiwi', 'Dragon Fruit', 'Celery', 'Oregano', 'Quinoa', 'Broccoli',
  'Zucchini', 'Bell Pepper', 'Blueberry', 'Basil', 'Greek Yogurt', 'Olive Oil', 'Chia Seeds',
];

const STEPS = [
  { n: '01', title: 'Search', text: 'A retailer searches for a product their customer wants — even a rare one.' },
  { n: '02', title: 'Match', text: 'Rurify ranks nearby wholesale suppliers by distance, price, stock, and reliability.' },
  { n: '03', title: 'Order or Request', text: 'Order directly, or raise a requirement if nothing nearby has it yet.' },
  { n: '04', title: 'Sync & Learn', text: 'Inventory stays in sync automatically, and demand feeds the intelligence engine.' },
];

export default function Landing() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative px-5 pt-20 pb-28 md:pt-28 md:pb-36">
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full opacity-20 blur-3xl float-anim"
          style={{ background: 'radial-gradient(circle, var(--color-accent), transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full opacity-20 blur-3xl float-anim"
          style={{ background: 'radial-gradient(circle, var(--color-dark-2), transparent 70%)', animationDelay: '2s' }}
        />

        <div className="relative mx-auto max-w-4xl text-center">
          <Reveal as="p" className="inline-block rounded-full bg-[var(--color-sand)] px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-[var(--color-text-soft)]">
            Rural Retail Supply Connectivity &amp; Demand Intelligence
          </Reveal>
          <Reveal as="h1" delay={1} className="mt-6 text-4xl font-extrabold leading-tight text-[var(--color-dark)] md:text-6xl">
            Connecting rural retailers to the supply they can&rsquo;t easily reach.
          </Reveal>
          <Reveal as="p" delay={2} className="mx-auto mt-6 max-w-2xl text-lg text-[var(--color-text-soft)]">
            Discover nearby wholesale suppliers, request unavailable products, and turn local
            demand into smarter stocking decisions.
          </Reveal>
          <Reveal delay={3} className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="rounded-xl bg-[var(--color-accent)] px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-orange-900/10 transition-transform hover:-translate-y-0.5"
            >
              Get started free
            </Link>
            <Link
              to="/how-it-works"
              className="rounded-xl border border-[var(--color-dark)]/15 px-7 py-3.5 text-base font-semibold text-[var(--color-dark)] transition-colors hover:bg-white"
            >
              See how it works
            </Link>
          </Reveal>
        </div>

        <Reveal variant="scale" delay={4} className="relative mx-auto mt-16 flex max-w-3xl flex-wrap items-center justify-center gap-3">
          {HARD_TO_FIND.map((item, i) => (
            <span
              key={item}
              className="float-anim rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--color-dark)] shadow-sm"
              style={{ animationDelay: `${(i % 5) * 0.4}s` }}
            >
              {item}
            </span>
          ))}
        </Reveal>
      </section>

      {/* Problem */}
      <section className="bg-white px-5 py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal as="p" className="text-xs font-bold uppercase tracking-wide text-[var(--color-accent)]">
            The problem
          </Reveal>
          <Reveal as="h2" delay={1} className="mt-3 max-w-2xl text-3xl font-bold text-[var(--color-dark)] md:text-4xl">
            The products exist. Local retailers just can&rsquo;t find them.
          </Reveal>
          <Reveal as="p" delay={2} className="mt-4 max-w-2xl text-[var(--color-text-soft)]">
            Specialty fruits, vegetables, herbs, and pantry items are often available at wholesale
            markets and distributors nearby &mdash; but the retailer has no visibility into who
            carries them, where, at what price, or whether stock is fresh and available today.
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { stat: 41, suffix: '', label: 'Local searches for Kiwi last month' },
              { stat: 0, suffix: '', label: 'Nearby suppliers currently carrying it' },
              { stat: 8, suffix: '', label: 'Retailers who requested Celery this week' },
            ].map((s, i) => (
              <Reveal key={s.label} variant="scale" delay={i + 1} className="rounded-2xl bg-[var(--color-sand)] p-8 text-center">
                <p className="text-5xl font-extrabold text-[var(--color-dark)]">
                  <AnimatedCounter target={s.stat} suffix={s.suffix} />
                </p>
                <p className="mt-3 text-sm text-[var(--color-text-soft)]">{s.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Solution flow */}
      <section className="px-5 py-24">
        <div className="mx-auto max-w-5xl text-center">
          <Reveal as="p" className="text-xs font-bold uppercase tracking-wide text-[var(--color-accent)]">
            The solution
          </Reveal>
          <Reveal as="h2" delay={1} className="mx-auto mt-3 max-w-2xl text-3xl font-bold text-[var(--color-dark)] md:text-4xl">
            One platform connecting every link in the chain
          </Reveal>

          <div className="mt-14 flex flex-col items-center gap-4 md:flex-row md:justify-center md:gap-3">
            {['Customer', 'Local Retailer', 'Rurify Platform', 'Wholesale Vendor'].map((node, i) => (
              <div key={node} className="flex items-center gap-3">
                <Reveal
                  variant="scale"
                  delay={i + 1}
                  className={`rounded-2xl px-6 py-5 font-bold shadow-sm ${
                    node === 'Rurify Platform'
                      ? 'bg-[var(--color-dark)] text-white'
                      : 'bg-white text-[var(--color-dark)]'
                  }`}
                >
                  {node}
                </Reveal>
                {i < 3 && (
                  <Reveal delay={i + 1} className="hidden text-2xl text-[var(--color-accent)] md:block">
                    &rarr;
                  </Reveal>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white px-5 py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal as="h2" className="text-center text-3xl font-bold text-[var(--color-dark)] md:text-4xl">
            How it works
          </Reveal>
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-4">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} variant={i % 2 === 0 ? 'left' : 'right'} delay={i + 1} className="rounded-2xl border border-black/5 p-6">
                <p className="text-sm font-bold text-[var(--color-accent)]">{step.n}</p>
                <h3 className="mt-2 text-lg font-bold text-[var(--color-dark)]">{step.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-text-soft)]">{step.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Retailer & Vendor benefits */}
      <section className="px-5 py-24">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
          <Reveal variant="left" className="rounded-2xl bg-[var(--color-dark)] p-8 text-[var(--color-accent-soft)]">
            <h3 className="text-xl font-bold text-white">For Local Retailers</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {[
                'Search any product and instantly see ranked nearby suppliers',
                'Compare distance, price, MOQ, and freshness with a transparent match score',
                'Raise a requirement when nothing is available — we track the demand',
                'Inventory and price changes sync automatically, no manual refresh',
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="text-[var(--color-accent)]">&#10003;</span>
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal variant="right" className="rounded-2xl bg-[var(--color-sand)] p-8">
            <h3 className="text-xl font-bold text-[var(--color-dark)]">For Wholesale Vendors</h3>
            <ul className="mt-5 space-y-3 text-sm text-[var(--color-text-soft)]">
              {[
                'Manage inventory manually or import it in bulk via CSV',
                'See real regional demand — not guesswork — for every product',
                'Get data-driven stocking recommendations with the reasoning shown',
                'Respond directly to retailer requirements and win new orders',
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="text-[var(--color-accent)]">&#10003;</span>
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Demand intelligence */}
      <section className="bg-white px-5 py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal as="p" className="text-xs font-bold uppercase tracking-wide text-[var(--color-accent)]">
            Demand intelligence
          </Reveal>
          <Reveal as="h2" delay={1} className="mt-3 max-w-2xl text-3xl font-bold text-[var(--color-dark)] md:text-4xl">
            A transparent, rule-based Demand Intelligence Score
          </Reveal>
          <Reveal as="p" delay={2} className="mt-4 max-w-2xl text-[var(--color-text-soft)]">
            Not a black box, and not marketed as AI. Every score is built from real searches,
            requirement requests, order attempts, and the gap between demand and nearby supply
            &mdash; explainable to any vendor who asks &ldquo;why?&rdquo;
          </Reveal>

          <Reveal variant="scale" delay={3} className="mt-10 overflow-hidden rounded-2xl border border-black/5">
            <div className="flex items-center justify-between bg-[var(--color-dark)] px-6 py-4 text-white">
              <span className="font-bold">
                Kiwi <span className="ml-2 text-xs font-normal text-[var(--color-accent-soft)]">illustrative example</span>
              </span>
              <span className="rounded-full bg-red-500/90 px-3 py-1 text-xs font-bold">VERY HIGH DEMAND</span>
            </div>
            <div className="grid grid-cols-2 gap-px bg-black/5 md:grid-cols-4">
              {[
                { label: 'Local searches', value: 41 },
                { label: 'Requirement requests', value: 15 },
                { label: 'Order attempts', value: 7 },
                { label: 'Nearby stock', value: '0 kg' },
              ].map((m) => (
                <div key={m.label} className="bg-white p-5 text-center">
                  <p className="text-2xl font-extrabold text-[var(--color-dark)]">{m.value}</p>
                  <p className="mt-1 text-xs text-gray-500">{m.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Future vision */}
      <section className="px-5 py-24">
        <div className="mx-auto max-w-5xl text-center">
          <Reveal as="h2" className="text-3xl font-bold text-[var(--color-dark)] md:text-4xl">
            Built to grow into a regional supply network
          </Reveal>
          <Reveal as="p" delay={1} className="mx-auto mt-4 max-w-2xl text-[var(--color-text-soft)]">
            From one retailer and one supplier, to many retailers, many vendors, and a full
            regional distribution network &mdash; with room for real-time sync, ERP integration,
            and demand forecasting as the platform matures.
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[var(--color-dark)] px-5 py-24 text-center">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 30%, var(--color-accent) 0, transparent 40%), radial-gradient(circle at 80% 70%, var(--color-dark-2) 0, transparent 40%)',
          }}
        />
        <Reveal variant="scale" className="relative mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold text-white md:text-4xl">Ready to see what your region is really asking for?</h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/register" className="rounded-xl bg-[var(--color-accent)] px-7 py-3.5 font-bold text-white">
              Create your free account
            </Link>
            <Link to="/login" className="rounded-xl border border-white/20 px-7 py-3.5 font-semibold text-white">
              Log in
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
