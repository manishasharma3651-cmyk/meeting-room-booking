"use client";

import { ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react";
import { addDays, formatDateLabel, todayISO } from "@/lib/time";

interface Props {
  date: string;
  onChange: (date: string) => void;
  onNewBooking: () => void;
}

export function DateNav({ date, onChange, onNewBooking }: Props) {
  const isToday = date === todayISO();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-5 py-4 sm:px-8">
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-sm border border-line">
          <button
            aria-label="Previous day"
            onClick={() => onChange(addDays(date, -1))}
            className="flex h-9 w-9 items-center justify-center text-ink-soft transition hover:bg-paper hover:text-ink"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 border-x border-line px-3 text-sm font-medium text-ink">
            <CalendarDays className="h-3.5 w-3.5 text-ink-soft" />
            <span>{formatDateLabel(date)}</span>
          </div>
          <button
            aria-label="Next day"
            onClick={() => onChange(addDays(date, 1))}
            className="flex h-9 w-9 items-center justify-center text-ink-soft transition hover:bg-paper hover:text-ink"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {!isToday && (
          <button
            onClick={() => onChange(todayISO())}
            className="text-sm text-ink-soft underline decoration-line underline-offset-4 transition hover:text-ink"
          >
            Jump to today
          </button>
        )}
        <input
          type="date"
          value={date}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-sm border border-line bg-paper px-2 py-1.5 text-sm text-ink-soft"
          aria-label="Pick a date"
        />
      </div>

      <button
        onClick={onNewBooking}
        className="flex items-center gap-1.5 rounded-sm bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink/90 active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" />
        New booking
      </button>
    </div>
  );
}
