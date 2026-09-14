"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarX2 } from "lucide-react";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Booking } from "@/lib/types";
import { displayTime } from "@/lib/time";
import { useToast } from "./ToastProvider";

interface Props {
  booking: (Booking & { roomName: string }) | null;
  onClose: () => void;
  onCancelled: () => void;
}

export function CancelDialog({ booking, onClose, onCancelled }: Props) {
  const { showToast } = useToast();
  const [cancelling, setCancelling] = useState(false);

  async function handleConfirm() {
    if (!booking) return;
    setCancelling(true);
    try {
      const result = await api.cancelBooking(booking.id);
      showToast("success", result.detail);
      onCancelled();
      onClose();
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Couldn't cancel the booking.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <AnimatePresence>
      {booking && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="w-full max-w-sm rounded-md border border-line bg-surface p-6 shadow-card"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-rust-light">
              <CalendarX2 className="h-4 w-4 text-rust" />
            </div>
            <h2 className="font-display text-lg font-medium text-ink">Cancel this booking?</h2>
            <p className="mt-1 text-sm text-ink-soft">
  <span className="font-medium text-ink">{booking.title}</span> in {booking.roomName},{" "}
  <span className="tabular-time">
    {displayTime(booking.start_time)}–{displayTime(booking.end_time)}
  </span>
  . This can&apos;t be undone.
</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-sm border border-line px-4 py-2 text-sm font-medium text-ink-soft transition hover:bg-paper"
              >
                Keep booking
              </button>
              <button
                onClick={handleConfirm}
                disabled={cancelling}
                className="rounded-sm bg-rust px-4 py-2 text-sm font-medium text-white transition hover:bg-rust/90 disabled:opacity-60"
              >
                {cancelling ? "Cancelling…" : "Cancel booking"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
