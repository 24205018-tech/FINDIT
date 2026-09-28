import { useEffect, useRef } from 'react';
import Icon from './Icons.jsx';

/**
 * Modal dialog: backdrop click & Escape close. Focus is trapped inside for
 * keyboard users. Optional size: sm | md | lg | xl.
 */
export default function Modal({
  open = false,
  onClose,
  title,
  subtitle,
  icon,
  size = 'md',
  children,
  footer,
  hideClose = false
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    const wasActive = document.activeElement;
    document.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    const t = setTimeout(() => dialogRef.current?.focus(), 40);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
      clearTimeout(t);
      wasActive?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div
        ref={dialogRef}
        className={`modal modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
        tabIndex={-1}
      >
        <header className="modal__header">
          <div className="modal__title-wrap">
            {icon && <Icon name={icon} size={20} />}
            <div>
              <h3 className="modal__title">{title}</h3>
              {subtitle && <p className="modal__subtitle">{subtitle}</p>}
            </div>
          </div>
          {!hideClose && (
            <button type="button" className="icon-btn" aria-label="Close dialog" onClick={onClose}>
              <Icon name="x" size={18} />
            </button>
          )}
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>
  );
}
