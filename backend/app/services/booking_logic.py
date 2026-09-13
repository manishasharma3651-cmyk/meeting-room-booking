"""
Pure booking logic: no DB session, no FastAPI objects.

Keeping this file free of ORM/route concerns means the two hardest pieces
of the assignment (conflict detection + next-available-slot) can be
reasoned about -- and unit tested -- as plain functions over
datetime.time values.
"""
from dataclasses import dataclass
from datetime import date, time, timedelta, datetime

from app.config import settings


@dataclass(frozen=True)
class ExistingBooking:
    """Minimal view of a booking needed for the logic below."""
    id: int
    title: str
    start_time: time
    end_time: time


class BookingValidationError(Exception):
    """Raised for 400-level problems: bad time window, outside working hours."""


class BookingConflictError(Exception):
    """Raised for 409: overlaps an existing booking. Carries the offender."""

    def __init__(self, conflicting: ExistingBooking):
        self.conflicting = conflicting
        super().__init__(
            f"Conflicts with existing booking '{conflicting.title}' "
            f"({_fmt(conflicting.start_time)}-{_fmt(conflicting.end_time)})"
        )


def _fmt(t: time) -> str:
    return t.strftime("%H:%M")


def validate_time_window(start_time: time, end_time: time) -> None:
    """
    Checks that apply regardless of what else is booked:
      - end must be strictly after start (rejects end == start and end < start)
      - both ends must fall within working hours (inclusive of the boundaries,
        so a booking may start exactly at open and end exactly at close)
    """
    if end_time <= start_time:
        raise BookingValidationError("End time must be after start time.")

    work_start = settings.work_start_time
    work_end = settings.work_end_time

    if start_time < work_start or end_time > work_end:
        raise BookingValidationError(
            f"Bookings must fall within working hours "
            f"({_fmt(work_start)}-{_fmt(work_end)})."
        )


def find_conflict(
    start_time: time,
    end_time: time,
    existing: list[ExistingBooking],
    exclude_booking_id: int | None = None,
) -> ExistingBooking | None:
    """
    Returns the first existing booking that overlaps [start_time, end_time),
    or None if the slot is free.

    Two half-open intervals [a_start, a_end) and [b_start, b_end) overlap
    iff a_start < b_end AND b_start < a_end. Using strict '<' on both sides
    (rather than <=) is what makes back-to-back bookings legal: a booking
    ending at 11:00 and one starting at 11:00 do NOT satisfy
    existing_start < new_end (11:00 < 11:00 is False), so they don't
    register as a conflict. This single inequality also covers every case
    in the spec for free: partial overlap at either edge, one range fully
    inside another, and identical ranges all satisfy both inequalities,
    while back-to-back ranges satisfy neither.
    """
    for booking in existing:
        if exclude_booking_id is not None and booking.id == exclude_booking_id:
            continue
        if booking.start_time < end_time and start_time < booking.end_time:
            return booking
    return None


def compute_next_available_slot(
    duration_minutes: int,
    existing: list[ExistingBooking],
) -> tuple[time, time] | None:
    """
    Earliest free window of at least `duration_minutes` inside working hours,
    given a room's existing bookings for one day.

    Approach: sort bookings by start time, then walk the timeline checking
    three kinds of gaps in order -- before the first booking, between
    consecutive bookings, and after the last booking until closing time.
    The first gap that's big enough wins, since we want the *earliest* slot.
    A gap exactly equal to the requested duration is valid (we compare with
    >=, not >), matching the back-to-back rule used in conflict detection.
    """
    work_start = settings.work_start_time
    work_end = settings.work_end_time
    duration = timedelta(minutes=duration_minutes)

    # Time arithmetic is easiest via datetime, so anchor everything to an
    # arbitrary shared date and work in datetimes internally.
    anchor = date(2000, 1, 1)

    def to_dt(t: time) -> datetime:
        return datetime.combine(anchor, t)

    day_start = to_dt(work_start)
    day_end = to_dt(work_end)

    ordered = sorted(existing, key=lambda b: b.start_time)

    cursor = day_start
    for booking in ordered:
        booking_start = to_dt(booking.start_time)
        booking_end = to_dt(booking.end_time)

        # Gap between wherever we are and this booking's start.
        if booking_start > cursor and (booking_start - cursor) >= duration:
            return cursor.time(), (cursor + duration).time()

        # Move the cursor forward past this booking (only if it actually
        # extends past where we already are -- guards against overlapping/
        # out-of-order data safely, though inputs are expected to be
        # non-overlapping since they passed conflict detection).
        if booking_end > cursor:
            cursor = booking_end

    # Trailing gap after the last booking (or the whole day, if none).
    if (day_end - cursor) >= duration:
        return cursor.time(), (cursor + duration).time()

    return None
