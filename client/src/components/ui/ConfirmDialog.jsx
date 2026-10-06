import Button from './Button';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="reveal-scale is-visible w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-[var(--color-dark)]">{title}</h3>
        <p className="mt-2 text-sm text-gray-500">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
