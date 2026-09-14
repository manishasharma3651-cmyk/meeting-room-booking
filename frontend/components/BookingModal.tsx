"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Room } from "@/lib/types";
import { useToast } from "./ToastProvider";

const WORK_START = "09:00";
const WORK_END = "18:00";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  rooms: Room[];
  defaultDate: string;
  defaultRoomId?: number | null;
  defaultStartTime?: string | null;
}

export function BookingModal({
  open,
  onClose,
  onCreated,
  rooms,
  defaultDate,
  defaultRoomId,
  defaultStartTime,
}: Props) {
  const { showToast } = useToast();

  const [roomId, setRoomId] = useState<number | "">(defaultRoomId ?? "");
  const [title, setTitle] = useState("");
  const [bookedBy, setBookedBy] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState(defaultStartTime ?? "09:00");
  const [endTime, setEndTime] = useState(bump30(defaultStartTime ?? "09:00"));
  const [duration, setDuration] = useState(30);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Reset local form state each time the modal opens for a (possibly) different slot.
  useEffect(() => {
    if (open) {
      setRoomId(defaultRoomId ?? "");
      setTitle("");
      setBookedBy("");
      setDate(defaultDate);
      const start = defaultStartTime ?? "09:00";
      setStartTime(start);
      setEndTime(bump30(start));
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultDate, defaultRoomId, defaultStartTime]);

  function bump30(hhmm: string): string {
    const [h, m] = hhmm.split(":").map(Number);
    const total = h * 60 + m + 30;
    const clamped = Math.min(total, 18 * 60);
    return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!roomId) next.roomId = "Choose a room.";
    if (!title.trim()) next.title = "Give the booking a title.";
    if (!date) next.date = "Pick a date.";
    if (!startTime || !endTime) {
      next.time = "Set both a start and end time.";
    } else if (endTime <= startTime) {
      next.time = "End time must be after start time.";
    } else if (startTime < WORK_START || endTime > WORK_END) {
      next.time = `Bookings must fall within working hours (${WORK_START}–${WORK_END}).`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !roomId) return;

    setSubmitting(true);
    try {
      await api.createBooking({
        room_id: roomId,
        title: title.trim(),
        booked_by: bookedBy.trim() || undefined,
        date,
        start_time: startTime,
        end_time: endTime,
      });
      showToast("success", `"${title.trim()}" booked for ${startTime}–${endTime}.`);
      onCreated();
      onClose();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong.";
      // 409 = conflict, 400 = bad time window — both are shown verbatim from the backend.
      showToast(err instanceof ApiError && err.status === 409 ? "error" : "warning", message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFindNextAvailable() {
    if (!roomId) {
      setErrors((prev) => ({ ...prev, roomId: "Choose a room first." }));
      return;
    }
    setCheckingAvailability(true);
    try {
      const result = await api.getNextAvailable(roomId, date, duration);
      if (result.available && result.start_time && result.end_time) {
        setStartTime(result.start_time.slice(0, 5));
        setEndTime(result.end_time.slice(0, 5));
        setErrors((prev) => ({ ...prev, time: "" }));
        showToast("info", result.message);
      } else {
        showToast("warning", result.message);
      }
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Couldn't check availability.");
    } finally {
      setCheckingAvailability(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Create a booking"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-md border border-line bg-surface p-6 shadow-card sm:rounded-md"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="font-display text-xl font-medium text-ink">New booking</h2>
                <p className="text-sm text-ink-soft">Working hours are {WORK_START}–{WORK_END}.</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-ink-soft transition hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field label="Room" error={errors.roomId}>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value ? Number(e.target.value) : "")}
                  className={inputClass(!!errors.roomId)}
                >
                  <option value="">Select a room</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} · seats {room.capacity}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Title" error={errors.title}>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Design review"
                  className={inputClass(!!errors.title)}
                />
              </Field>

              <Field label="Booked by (optional)">
                <input
                  value={bookedBy}
                  onChange={(e) => setBookedBy(e.target.value)}
                  placeholder="Your name"
                  className={inputClass(false)}
                />
              </Field>

              <Field label="Date" error={errors.date}>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass(!!errors.date)}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Start time" error={errors.time}>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={inputClass(!!errors.time)}
                  />
                </Field>
                <Field label="End time">
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={inputClass(!!errors.time)}
                  />
                </Field>
              </div>
              {errors.time && <p className="-mt-2 text-xs text-rust">{errors.time}</p>}

              <div className="rounded-sm border border-dashed border-line bg-paper/60 p-3">
               <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-soft">
  <CalendarClock className="h-3.5 w-3.5" />
  Not sure when it&apos;s free?
</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={5}
                    max={540}
                    step={5}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-20 rounded-sm border border-line bg-surface px-2 py-1.5 text-sm"
                    aria-label="Duration in minutes"
                  />
                  <span className="text-xs text-ink-soft">minutes</span>
                  <button
                    type="button"
                    onClick={handleFindNextAvailable}
                    disabled={checkingAvailability}
                    className="ml-auto flex items-center gap-1.5 rounded-sm border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-paper disabled:opacity-60"
                  >
                    <Search className="h-3.5 w-3.5" />
                    {checkingAvailability ? "Checking…" : "Find next available"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-1 rounded-sm bg-ink py-2.5 text-sm font-medium text-paper transition hover:bg-ink/90 active:scale-[0.99] disabled:opacity-60"
              >
                {submitting ? "Booking…" : "Confirm booking"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-ink-soft">{label}</span>
      {children}
      {error ? <span className="text-xs text-rust">{error}</span> : null}
    </label>
  );
}

function inputClass(hasError: boolean) {
  return `rounded-sm border bg-surface px-3 py-2 text-sm text-ink outline-none transition focus:border-ink ${
    hasError ? "border-rust" : "border-line"
  }`;
}
