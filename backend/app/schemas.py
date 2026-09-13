from datetime import date as date_type
from datetime import time as time_type

from pydantic import BaseModel, ConfigDict, Field


# ---------- Rooms ----------

class RoomOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    capacity: int
    location: str | None = None


# ---------- Bookings ----------

class BookingCreate(BaseModel):
    room_id: int
    title: str = Field(min_length=1, max_length=200)
    booked_by: str | None = Field(default=None, max_length=120)
    date: date_type
    start_time: time_type
    end_time: time_type


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    room_id: int
    title: str
    booked_by: str | None = None
    date: date_type
    start_time: time_type
    end_time: time_type


class RoomWithBookings(RoomOut):
    bookings: list[BookingOut] = []


# ---------- Next available slot ----------

class NextAvailableOut(BaseModel):
    room_id: int
    date: date_type
    duration_minutes: int
    available: bool
    start_time: time_type | None = None
    end_time: time_type | None = None
    message: str


# ---------- Errors ----------
# Shape returned for every handled error (400/404/409/500) so the frontend
# can always read `detail` as a plain, displayable string.

class ErrorResponse(BaseModel):
    detail: str
