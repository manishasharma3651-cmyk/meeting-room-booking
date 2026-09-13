"use client";

import { motion } from "framer-motion";
import { DoorOpen, Users } from "lucide-react";
import type { Room } from "@/lib/types";

interface Props {
  rooms: Room[];
  selectedRoomId: number | null;
  onSelectRoom: (roomId: number | null) => void;
}

export function Sidebar({ rooms, selectedRoomId, onSelectRoom }: Props) {
  return (
    <aside className="flex h-full w-full flex-col gap-6 border-line bg-surface px-5 py-6 lg:w-64 lg:border-r">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-ink text-paper">
          <DoorOpen className="h-4 w-4" />
        </div>
        <div>
          <p className="font-display text-lg font-medium leading-tight text-ink">Roomkeeper</p>
          <p className="text-xs text-ink-soft">Meeting room bookings</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        <p className="mb-1 px-2 text-xs text-ink-soft">Rooms</p>
        <RoomRow
          label="All rooms"
          active={selectedRoomId === null}
          onClick={() => onSelectRoom(null)}
        />
        {rooms.map((room) => (
          <RoomRow
            key={room.id}
            label={room.name}
            sublabel={`${room.location ?? ""}`}
            capacity={room.capacity}
            active={selectedRoomId === room.id}
            onClick={() => onSelectRoom(room.id)}
          />
        ))}
      </nav>
    </aside>
  );
}

function RoomRow({
  label,
  sublabel,
  capacity,
  active,
  onClick,
}: {
  label: string;
  sublabel?: string;
  capacity?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-between rounded-sm px-3 py-2.5 text-left transition-colors ${
        active ? "bg-brass-light text-ink" : "text-ink-soft hover:bg-paper hover:text-ink"
      }`}
    >
      {active && (
        <motion.span
          layoutId="room-active-indicator"
          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-brass"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
      <span className="pl-1">
        <span className="block text-sm font-medium">{label}</span>
        {sublabel ? <span className="block text-xs text-ink-soft/80">{sublabel}</span> : null}
      </span>
      {capacity ? (
        <span className="flex items-center gap-1 text-xs text-ink-soft/80">
          <Users className="h-3 w-3" />
          {capacity}
        </span>
      ) : null}
    </button>
  );
}
