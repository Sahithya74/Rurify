import Reveal from '../../components/ui/Reveal';

export default function About() {
  return (
    <div className="px-5 py-20">
      <div className="mx-auto max-w-3xl">
        <Reveal as="h1" className="text-4xl font-extrabold text-[var(--color-dark)]">
          About Rurify
        </Reveal>
        <Reveal as="p" delay={1} className="mt-6 text-lg leading-relaxed text-[var(--color-text-soft)]">
          Rurify is an intelligent rural retail supply-connectivity platform that connects local
          retailers with nearby wholesale suppliers, identifies unmet product demand, synchronizes
          supplier inventory, and provides data-driven stocking intelligence.
        </Reveal>
        <Reveal as="p" delay={2} className="mt-5 leading-relaxed text-[var(--color-text-soft)]">
          In large cities, grocery stores have organized digital supply chains and easy access to
          specialty products. In smaller towns and semi-urban regions, local shops often can&rsquo;t
          find the same items &mdash; not because the products don&rsquo;t exist, but because there
          is no visibility into which wholesale supplier has them, where, at what price, or whether
          stock is currently available.
        </Reveal>
        <Reveal as="p" delay={3} className="mt-5 leading-relaxed text-[var(--color-text-soft)]">
          Rurify closes that gap. It doesn&rsquo;t just help a retailer find a product &mdash; it
          helps the whole ecosystem understand what people want, where they want it, who can supply
          it, what is currently unavailable, and what suppliers should stock next.
        </Reveal>

        <Reveal delay={4} className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            ['Retailers', 'Search, compare suppliers, order, and raise requirements.'],
            ['Vendors', 'Manage inventory, respond to demand, and get stocking guidance.'],
            ['Admins', 'Oversee users, products, orders, and regional analytics.'],
            ['Platform', 'Synchronizes inventory and turns activity into demand intelligence.'],
          ].map(([title, text]) => (
            <div key={title} className="rounded-xl bg-[var(--color-sand)] p-5">
              <p className="font-bold text-[var(--color-dark)]">{title}</p>
              <p className="mt-1 text-sm text-[var(--color-text-soft)]">{text}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </div>
  );
}
