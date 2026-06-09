import './Toast.css';

const TYPE_ICONS = { success: '✓', error: '✕', info: 'ℹ' };

export default function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-stack" aria-live="polite" aria-label="Notifications">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`} role="status">
          <span className="toast__icon" aria-hidden="true">
            {TYPE_ICONS[t.type] ?? '●'}
          </span>
          <span className="toast__message">{t.message}</span>
          <button
            type="button"
            className="toast__close"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
