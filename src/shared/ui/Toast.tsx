import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

interface ToastItem {
  id: number;
  message: string;
  error?: boolean;
}

interface ToastApi {
  show: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, error?: boolean) => {
    const id = Date.now() + Math.random();
    setItems(list => [...list.slice(-2), { id, message, error }]);
    window.setTimeout(() => setItems(list => list.filter(item => item.id !== id)), error ? 6000 : 3500);
  }, []);

  const api = useMemo<ToastApi>(() => ({ show: m => push(m), error: m => push(m, true) }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map(item => (
          <div key={item.id} className={`toast${item.error ? ' error' : ''}`} role={item.error ? 'alert' : 'status'}>
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastApi => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};
