import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);
let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, type = 'info') => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove]
  );

  const value = useMemo(
    () => ({
      success: (msg) => push(msg, 'success'),
      error: (msg) => push(msg, 'error'),
      info: (msg) => push(msg, 'info'),
    }),
    [push]
  );

  const styles = {
    success: 'bg-[var(--color-dark)] border-l-4 border-emerald-400',
    error: 'bg-[var(--color-dark)] border-l-4 border-red-400',
    info: 'bg-[var(--color-dark)] border-l-4 border-[var(--color-accent)]',
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed inset-x-4 bottom-20 z-50 flex flex-col gap-3 md:inset-x-auto md:right-6 md:bottom-6 md:w-80">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-enter rounded-lg px-4 py-3 text-sm text-white shadow-lg ${styles[t.type]}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
