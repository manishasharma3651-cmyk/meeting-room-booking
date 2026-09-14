"use client";

import { CalendarSearch, WifiOff } from "lucide-react";

export function TimelineSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-line">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="flex items-center gap-4 py-4 pl-4">
          <div className="h-3 w-24 rounded bg-line" />
          <div className="h-10 flex-1 rounded bg-line/60" />
        </div>
      ))}
    </div>
  );
}

export function EmptyRooms() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-20 text-center">
      <CalendarSearch className="h-8 w-8 text-ink-soft/50" />
      <p className="font-display text-lg text-ink">No rooms match this filter</p>
      <p className="max-w-xs text-sm text-ink-soft">
        Choose &quot;All rooms&quot; from the sidebar, or pick a different room to see its schedule.
      </p>
    </div>
  );
}

export function LoadFailed({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <WifiOff className="h-8 w-8 text-rust/60" />
      <p className="font-display text-lg text-ink">Couldn&apos;t load the schedule</p>
      <p className="max-w-xs text-sm text-ink-soft">{message}</p>
      <button
        onClick={onRetry}
        className="mt-1 rounded-sm border border-line px-4 py-2 text-sm font-medium text-ink transition hover:bg-paper"
      >
        Try again
      </button>
    </div>
  );
}
