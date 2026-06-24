"use client";

import { useState, useEffect } from "react";
import { toastEmitter, ToastPayload } from "@/utils/toast";
import { CheckCircle2, AlertCircle } from "lucide-react";

export function Toaster() {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  useEffect(() => {
    const unsub: () => void = toastEmitter.subscribe((toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 2500);
    });
    return unsub;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl text-sm font-medium text-gray-900 dark:text-white pointer-events-auto"
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-indigo-500 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
