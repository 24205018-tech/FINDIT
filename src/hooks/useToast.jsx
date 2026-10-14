import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

let seq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (toast) => {
      const id = `t-${Date.now()}-${seq++}`;
      setToasts((prev) => [...prev.slice(-3), { id, ...toast }]);
      window.setTimeout(() => dismiss(id), toast.duration || 4200);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toast-stack" role="region" aria-label="Notifications">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.kind || 'info'}`} role="status">
            <div className="toast__body">
              {t.title && <div className="toast__title">{t.title}</div>}
              {t.message && <div className="toast__message">{t.message}</div>}
            </div>
            <button
              type="button"
              className="toast__close"
              aria-label="Dismiss notification"
              onClick={() => dismiss(t.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

/** Submit-time state for forms (async form work) */
export function useFormBusy() {
  const [busy, setBusy] = useState(false);
  return { busy, setBusy };
}
