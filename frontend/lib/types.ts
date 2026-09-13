export interface Room {
  id: number;
  name: string;
  capacity: number;
  location: string | null;
}

export interface Booking {
  id: number;
  room_id: number;
  title: string;
  booked_by: string | null;
  date: string; // "YYYY-MM-DD"
  start_time: string; // "HH:MM:SS"
  end_time: string; // "HH:MM:SS"
}

export interface RoomWithBookings extends Room {
  bookings: Booking[];
}

export interface NextAvailableResult {
  room_id: number;
  date: string;
  duration_minutes: number;
  available: boolean;
  start_time: string | null;
  end_time: string | null;
  message: string;
}

export interface BookingDraft {
  room_id: number;
  title: string;
  booked_by?: string;
  date: string;
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
}
