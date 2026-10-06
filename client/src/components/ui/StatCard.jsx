export default function StatCard({ label, value, hint, accent = false }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition-transform hover:-translate-y-0.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent ? 'text-[var(--color-accent)]' : 'text-[var(--color-dark)]'}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
