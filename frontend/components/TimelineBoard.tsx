"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Booking, RoomWithBookings } from "@/lib/types";
import {
  WORK_DAY_MIN,
  WORK_END_MIN,
  WORK_START_MIN,
  displayTime,
  fromMinutes,
  slotToPercent,
} from "@/lib/time";

const HOURS = Array.from(
  { length: WORK_END_MIN / 60 - WORK_START_MIN / 60 + 1 },
  (_, i) => WORK_START_MIN / 60 + i
);

interface Props {
  rooms: RoomWithBookings[];
  onSlotClick: (roomId: number, startHHMM: string) => void;
  onBookingClick: (booking: Booking, roomName: string) => void;
}

export function TimelineBoard({ rooms, onSlotClick, onBookingClick }: Props) {
  return (
    <div className="overflow-x-auto">
   <div className="min-w-[720px] p-[10px]">
        {/* Hour ruler */}
        <div className="flex border-b border-line pl-40 text-xs text-ink-soft">
          {HOURS.map((hour) => (
            <div key={hour} className="flex-1 border-l border-line py-2 pl-2 first:border-l-0">
              <span className="tabular-time">{String(hour).padStart(2, "0")}:00</span>
            </div>
          ))}
        </div>

        {/* Room tracks */}
        <div className="divide-y divide-line">
          {rooms.map((room) => (
            <RoomTrack
              key={room.id}
              room={room}
              onSlotClick={onSlotClick}
              onBookingClick={onBookingClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function RoomTrack({
  room,
  onSlotClick,
  onBookingClick,
}: {
  room: RoomWithBookings;
  onSlotClick: (roomId: number, startHHMM: string) => void;
  onBookingClick: (booking: Booking, roomName: string) => void;
}) {
  function handleTrackClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const rawMinutes = WORK_START_MIN + ratio * WORK_DAY_MIN;
    // Snap to the nearest 15 minutes so clicks land on tidy start times.
    const snapped = Math.round(rawMinutes / 15) * 15;
    const clamped = Math.min(Math.max(snapped, WORK_START_MIN), WORK_END_MIN - 15);
    onSlotClick(room.id, fromMinutes(clamped));
  }

  return (
    <div className="flex items-stretch">
      <div className="flex w-40 shrink-0 flex-col justify-center border-r border-line py-3 pr-3">
        <p className="text-sm font-medium text-ink">{room.name}</p>
        <p className="text-xs text-ink-soft">{room.bookings.length} booking{room.bookings.length === 1 ? "" : "s"}</p>
      </div>

      <div
        onClick={handleTrackClick}
        className="group relative h-16 flex-1 cursor-cell bg-surface transition-colors hover:bg-paper/60"
        title="Click a free spot to book this room"
      >
        {/* Hour gridlines, purely visual */}
        <div className="pointer-events-none absolute inset-0 flex">
          {HOURS.slice(0, -1).map((hour) => (
            <div key={hour} className="flex-1 border-l border-line/70 first:border-l-0" />
          ))}
        </div>

        <AnimatePresence initial={false}>
          {room.bookings.map((booking) => (
            <BookingBlock
              key={booking.id}
              booking={booking}
              onClick={(e) => {
                e.stopPropagation();
                onBookingClick(booking, room.name);
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function BookingBlock({
  booking,
  onClick,
}: {
  booking: Booking;
  onClick: (e: React.MouseEvent) => void;
}) {
  const { left, width } = slotToPercent(booking.start_time, booking.end_time);
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      onClick={onClick}
      style={{ left, width }}
      className="absolute top-2 bottom-2 flex flex-col justify-center overflow-hidden rounded-sm border border-brass-dark/30 bg-brass-light px-2.5 text-left shadow-sm transition hover:brightness-95"
    >
      <span className="truncate text-xs font-medium text-ink">{booking.title}</span>
      <span className="truncate text-[11px] tabular-time text-ink-soft">
        {displayTime(booking.start_time)}–{displayTime(booking.end_time)}
      </span>
    </motion.button>
  );
}
