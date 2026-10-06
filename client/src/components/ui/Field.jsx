export function Label({ children }) {
  return <label className="mb-1.5 block text-sm font-semibold text-[var(--color-dark)]">{children}</label>;
}

const baseInput =
  'w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20';

export function Input({ className = '', ...props }) {
  return <input className={`${baseInput} ${className}`} {...props} />;
}

export function Select({ children, className = '', ...props }) {
  return (
    <select className={`${baseInput} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`${baseInput} ${className}`} rows={3} {...props} />;
}

export function Field({ label, children, error }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
