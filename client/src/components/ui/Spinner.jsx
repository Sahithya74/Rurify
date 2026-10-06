export default function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
      <span className="h-8 w-8 animate-spin rounded-full border-3 border-gray-200 border-t-[var(--color-accent)]" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
