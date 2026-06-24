type ToastType = "success" | "error";
export type ToastPayload = { id: string; message: string; type: ToastType };
type Handler = (toast: ToastPayload) => void;

const handlers = new Set<Handler>();
let counter = 0;

export const toastEmitter = {
  subscribe: (handler: Handler) => {
    handlers.add(handler);
    return () => handlers.delete(handler);
  },
  emit: (payload: ToastPayload) => {
    handlers.forEach((h) => h(payload));
  },
};

export function showToast(message: string, type: ToastType = "success") {
  if (typeof window === "undefined") return;
  toastEmitter.emit({ id: `toast-${++counter}`, message, type });
}
