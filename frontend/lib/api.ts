import type { Booking, BookingDraft, NextAvailableResult, Room, RoomWithBookings } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** Thrown for any non-2xx response; message is always the backend's `detail`
 * string so callers (toasts) can display exactly what the server said. */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options?.headers },
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status}).`;
    try {
      const body = await response.json();
      if (body?.detail) detail = body.detail;
    } catch {
      // Response wasn't JSON (e.g. a raw 502 from a cold Render instance) — keep the fallback.
    }
    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  getRooms: () => request<Room[]>("/api/rooms"),

  getRoomsWithBookings: (date: string, roomId?: number) => {
    const params = new URLSearchParams({ date });
    if (roomId) params.set("room_id", String(roomId));
    return request<RoomWithBookings[]>(`/api/rooms/with-bookings?${params.toString()}`);
  },

  createBooking: (draft: BookingDraft) =>
    request<Booking>("/api/bookings", {
      method: "POST",
      body: JSON.stringify(draft),
    }),

  cancelBooking: (bookingId: number) =>
    request<{ detail: string }>(`/api/bookings/${bookingId}`, { method: "DELETE" }),

  getNextAvailable: (roomId: number, date: string, durationMinutes: number) => {
    const params = new URLSearchParams({ date, duration: String(durationMinutes) });
    return request<NextAvailableResult>(`/api/rooms/${roomId}/next-available?${params.toString()}`);
  },
};
