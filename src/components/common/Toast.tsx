// Lightweight, animated toast system. Toasts stack in a fixed viewport and never
// block interaction (used e.g. for the background history download progress).
//
// useToast() -> { push, update, dismiss }. A pushed toast returns its id so a
// long-running task can update its progress/message/variant in place and let it
// auto-dismiss when it finishes.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastVariant = "info" | "success" | "error";

export interface ToastData {
  id: string;
  title?: string;
  message?: string;
  /** 0..100 to show a progress bar; null/undefined = no bar. */
  progress?: number | null;
  variant?: ToastVariant;
  /** FontAwesome class, e.g. "fa-box-archive". */
  icon?: string;
  /** When true the toast stays until explicitly updated/dismissed. */
  sticky?: boolean;
  /** Auto-dismiss delay (ms) for non-sticky toasts. */
  duration?: number;
}

interface ToastApi {
  push: (t: Omit<ToastData, "id">) => string;
  update: (id: string, patch: Partial<Omit<ToastData, "id">>) => void;
  dismiss: (id: string) => void;
}

const noop = () => {};
const ToastContext = createContext<ToastApi>({
  push: () => "",
  update: noop,
  dismiss: noop,
});

export function useToast(): ToastApi {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const idRef = useRef(0);

  const push = useCallback((t: Omit<ToastData, "id">): string => {
    const id = `toast-${++idRef.current}`;
    setToasts((prev) => [...prev, { variant: "info", ...t, id }]);
    return id;
  }, []);

  const update = useCallback(
    (id: string, patch: Partial<Omit<ToastData, "id">>) => {
      setToasts((prev) =>
        prev.map((x) => (x.id === id ? { ...x, ...patch } : x))
      );
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ push, update, dismiss }}>
      {children}
      <div className="toast-viewport" role="region" aria-label="Notifications">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastData;
  onDismiss: (id: string) => void;
}) {
  const [leaving, setLeaving] = useState(false);

  const close = useCallback(() => {
    setLeaving(true);
    // Let the exit animation play before removing from the array.
    window.setTimeout(() => onDismiss(toast.id), 220);
  }, [toast.id, onDismiss]);

  // Non-sticky toasts auto-dismiss. Re-runs when `sticky` flips (e.g. a progress
  // toast turned into a success), scheduling dismissal at that point.
  useEffect(() => {
    if (toast.sticky) return;
    const id = window.setTimeout(close, toast.duration ?? 4200);
    return () => window.clearTimeout(id);
  }, [toast.sticky, toast.duration, close]);

  const hasProgress = typeof toast.progress === "number";

  return (
    <div
      className={`toast toast--${toast.variant ?? "info"}${
        leaving ? " is-leaving" : ""
      }`}
      role="status"
      aria-live="polite"
    >
      {toast.icon && (
        <span className="toast__icon" aria-hidden="true">
          <i className={`fa-solid ${toast.icon}`} />
        </span>
      )}
      <div className="toast__body">
        {toast.title && <div className="toast__title">{toast.title}</div>}
        {toast.message && <div className="toast__msg">{toast.message}</div>}
        {hasProgress && (
          <div
            className="toast__progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(toast.progress as number)}
          >
            <div
              className="toast__progress-fill"
              style={{ width: `${Math.max(3, Math.min(100, toast.progress as number))}%` }}
            />
          </div>
        )}
      </div>
      <button
        type="button"
        className="toast__close"
        onClick={close}
        aria-label="Dismiss notification"
      >
        <i className="fa-solid fa-xmark" aria-hidden="true" />
      </button>
    </div>
  );
}

export default ToastProvider;
