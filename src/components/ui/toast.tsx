import { useEffect, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { registerToastFn } from './show-toast';

type ToastVariant = 'success' | 'error';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

let toastId = 0;

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const addToast = useCallback((message: string, variant: ToastVariant) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, variant }]);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timersRef.current.delete(id);
    }, 4000);
    timersRef.current.set(id, timer);
  }, []);

  useEffect(() => {
    registerToastFn(addToast);
    const timers = timersRef.current;
    return () => {
      registerToastFn(null);
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, [addToast]);

  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'glass-elevated flex items-center gap-3 rounded-xl px-4 py-3',
            toast.variant === 'success'
              ? 'text-success'
              : 'text-danger-text',
          )}
        >
          {toast.variant === 'success' ? (
            <CheckCircle className="h-5 w-5 shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 shrink-0" />
          )}
          <span className="text-sm font-medium text-text-primary">{toast.message}</span>
          <button
            onClick={() => dismiss(toast.id)}
            className="ml-2 shrink-0 rounded-lg p-0.5 text-text-tertiary transition-colors duration-200 hover:bg-white/[0.05] hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
