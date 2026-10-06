import Reveal from '../../components/ui/Reveal';

const FLOWS = [
  {
    title: 'Finding a product',
    steps: [
      'Retailer searches for a product (e.g. "Avocado")',
      'Rurify ranks nearby suppliers by distance, price, availability, MOQ, freshness, delivery, and reliability',
      'Retailer compares suppliers side by side using the transparent match score',
      'Retailer places an order; the vendor accepts and fulfills it',
    ],
  },
  {
    title: 'When nothing is available',
    steps: [
      'Retailer searches and finds zero nearby stock',
      'Retailer raises a requirement with quantity and a needed-by date',
      'Rurify aggregates requirements across all retailers for that product',
      'Vendors see real demand (e.g. "8 retailers, 42kg, 0kg nearby stock") and can respond',
    ],
  },
  {
    title: 'Keeping inventory in sync',
    steps: [
      'A vendor adds a new product, changes a price, or updates stock',
      'The change is logged and connected retailers are notified automatically',
      'Retailer dashboards reflect it on the next sync cycle — no manual refresh',
    ],
  },
  {
    title: 'Deciding what to stock next',
    steps: [
      'Searches, requirement requests, and orders accumulate real activity data',
      'The Demand Intelligence Score ranks products by regional demand',
      'Vendors see a stocking recommendation with the reasoning spelled out in numbers',
    ],
  },
];

export default function HowItWorks() {
  return (
    <div className="px-5 py-20">
      <div className="mx-auto max-w-4xl">
        <Reveal as="h1" className="text-4xl font-extrabold text-[var(--color-dark)]">
          How Rurify works
        </Reveal>
        <Reveal as="p" delay={1} className="mt-4 max-w-2xl text-[var(--color-text-soft)]">
          Four everyday flows that make up the platform &mdash; from finding a product to deciding
          what a vendor should stock next.
        </Reveal>

        <div className="mt-14 space-y-10">
          {FLOWS.map((flow, i) => (
            <Reveal key={flow.title} delay={(i % 5) + 1} className="rounded-2xl border border-black/5 bg-white p-7">
              <h2 className="text-xl font-bold text-[var(--color-dark)]">{flow.title}</h2>
              <ol className="mt-4 space-y-3">
                {flow.steps.map((step, idx) => (
                  <li key={step} className="flex gap-4 text-sm text-[var(--color-text-soft)]">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-sand)] text-xs font-bold text-[var(--color-dark)]">
                      {idx + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
