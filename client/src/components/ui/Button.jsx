const VARIANTS = {
  primary: 'bg-[var(--color-accent)] text-white hover:brightness-95',
  dark: 'bg-[var(--color-dark)] text-white hover:bg-[var(--color-dark-2)]',
  outline: 'border border-[var(--color-dark)] text-[var(--color-dark)] hover:bg-[var(--color-sand)]',
  ghost: 'text-[var(--color-dark)] hover:bg-[var(--color-sand)]',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  loading,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {children}
    </button>
  );
}
