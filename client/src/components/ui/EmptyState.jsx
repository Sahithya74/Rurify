export default function EmptyState({ title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white/50 px-6 py-14 text-center">
      <h3 className="text-lg font-semibold text-[var(--color-dark)]">{title}</h3>
      {message && <p className="mt-2 max-w-sm text-sm text-gray-500">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
