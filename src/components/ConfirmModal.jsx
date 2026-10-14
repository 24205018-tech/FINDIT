import Button from './Button.jsx';

/** Confirmation dialog with danger styling */
export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  busy = false,
  variant = 'danger'
}) {
  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose?.();
      }}
    >
      <div className="modal modal--sm" role="dialog" aria-modal="true" aria-label={title}>
        <div className="confirm">
          <span className={`confirm__icon confirm__icon--${variant}`}>!</span>
          <h3 className="confirm__title">{title}</h3>
          {message && <p className="confirm__message">{message}</p>}
          <div className="confirm__actions">
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant={variant === 'danger' ? 'danger' : 'primary'}
              onClick={onConfirm}
              loading={busy}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
