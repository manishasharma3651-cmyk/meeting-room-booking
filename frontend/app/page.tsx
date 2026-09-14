"use client";

import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { DateNav } from "@/components/DateNav";
import { TimelineBoard } from "@/components/TimelineBoard";
import { BookingModal } from "@/components/BookingModal";
import { CancelDialog } from "@/components/CancelDialog";
import { EmptyRooms, LoadFailed, TimelineSkeleton } from "@/components/StateViews";
import { api, ApiError } from "@/lib/api";
import type { Booking, Room, RoomWithBookings } from "@/lib/types";
import { todayISO } from "@/lib/time";

export default function HomePage() {
  const [date, setDate] = useState(todayISO());
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [rooms, setRooms] = useState<RoomWithBookings[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [prefill, setPrefill] = useState<{ roomId?: number; startTime?: string }>({});
  const [cancelTarget, setCancelTarget] = useState<(Booking & { roomName: string }) | null>(null);

  // Room list rarely changes, so it's fetched once independently of the
  // per-date schedule (used for the sidebar and the booking-form dropdown).
  useEffect(() => {
    api.getRooms().then(setAllRooms).catch(() => {
      /* surfaced via the main schedule load error instead */
    });
  }, []);

  const loadSchedule = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    api
      .getRoomsWithBookings(date, selectedRoomId ?? undefined)
      .then(setRooms)
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Unknown error."))
      .finally(() => setLoading(false));
  }, [date, selectedRoomId]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  function openBookingModal(roomId?: number, startTime?: string) {
    setPrefill({ roomId, startTime });
    setModalOpen(true);
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar rooms={allRooms} selectedRoomId={selectedRoomId} onSelectRoom={setSelectedRoomId} />

      <main className="flex-1">
        <DateNav date={date} onChange={setDate} onNewBooking={() => openBookingModal()} />

        <div className="px-2 py-4 sm:px-6 sm:py-6">
          <div className="rounded-md border border-line bg-surface shadow-card">
            {loading ? (
              <TimelineSkeleton />
            ) : loadError ? (
              <LoadFailed message={loadError} onRetry={loadSchedule} />
            ) : rooms.length === 0 ? (
              <EmptyRooms />
            ) : (
              <TimelineBoard
                rooms={rooms}
                onSlotClick={(roomId, startTime) => openBookingModal(roomId, startTime)}
                onBookingClick={(booking, roomName) => setCancelTarget({ ...booking, roomName })}
              />
            )}
          </div>
          <p className="mt-3 px-2 text-xs text-ink-soft">
            Tip: click an empty spot on a room&apos;s row to start a booking there, or click an existing

          </p>
        </div>
      </main>

      <BookingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadSchedule}
        rooms={allRooms}
        defaultDate={date}
        defaultRoomId={prefill.roomId}
        defaultStartTime={prefill.startTime}
      />

      <CancelDialog
        booking={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onCancelled={loadSchedule}
      />
    </div>
  );
}
