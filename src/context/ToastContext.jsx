import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ToastContainer from '../components/common/Toast';

const ToastContext = createContext(null);

let _nextId = 1;

/** Provides a toast(message, type, link?) function and auto-dismisses notifications after 4 seconds. */
export function ToastProvider({ children }) {
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, type = 'success', link = null) => {
      const id = _nextId++;
      setToasts((prev) => [...prev.slice(-4), { id, message, type, link }]);
      timers.current[id] = setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} onNavigate={navigate} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const fn = useContext(ToastContext);
  if (!fn) throw new Error('useToast must be used inside ToastProvider');
  return fn;
}
