"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";

type ToastKind = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  showToast: (kind: ToastKind, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

const KIND_STYLES: Record<ToastKind, { bg: string; fg: string; icon: React.ElementType }> = {
  success: { bg: "bg-moss-light", fg: "text-moss", icon: CheckCircle2 },
  error: { bg: "bg-rust-light", fg: "text-rust", icon: XCircle },
  warning: { bg: "bg-brass-light", fg: "text-brass-dark", icon: AlertTriangle },
  info: { bg: "bg-white", fg: "text-ink-soft", icon: Info },
};

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId++;
      setToasts((current) => [...current, { id, kind, message }]);
      // Errors stay a little longer since the message can be denser
      // (e.g. a conflict explanation naming the clashing booking).
      const timeout = kind === "error" ? 6000 : 4000;
      setTimeout(() => dismiss(id), timeout);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const style = KIND_STYLES[toast.kind];
            const Icon = style.icon;
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.96, transition: { duration: 0.15 } }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className={`pointer-events-auto flex items-start gap-2.5 rounded-md border border-line ${style.bg} px-4 py-3 shadow-card`}
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.fg}`} />
                <p className="flex-1 text-sm leading-snug text-ink">{toast.message}</p>
                <button
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss notification"
                  className="mt-0.5 shrink-0 text-ink-soft/60 transition hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
