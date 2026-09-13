from datetime import time

import pytest

from app.services.booking_logic import (
    BookingValidationError,
    ExistingBooking,
    compute_next_available_slot,
    find_conflict,
    validate_time_window,
)


def t(hh: int, mm: int = 0) -> time:
    return time(hh, mm)


EXISTING = [ExistingBooking(id=1, title="Standup", start_time=t(10), end_time=t(11))]


# ---------- Part A: conflict detection ----------

def test_partial_overlap_at_start():
    conflict = find_conflict(t(9, 30), t(10, 30), EXISTING)
    assert conflict is not None and conflict.id == 1


def test_partial_overlap_at_end():
    conflict = find_conflict(t(10, 30), t(11, 30), EXISTING)
    assert conflict is not None and conflict.id == 1


def test_fully_inside_existing():
    conflict = find_conflict(t(10, 15), t(10, 45), EXISTING)
    assert conflict is not None


def test_fully_contains_existing():
    conflict = find_conflict(t(9), t(12), EXISTING)
    assert conflict is not None


def test_identical_range():
    conflict = find_conflict(t(10), t(11), EXISTING)
    assert conflict is not None


def test_back_to_back_before_is_allowed():
    conflict = find_conflict(t(9), t(10), EXISTING)
    assert conflict is None


def test_back_to_back_after_is_allowed():
    conflict = find_conflict(t(11), t(12), EXISTING)
    assert conflict is None


def test_no_overlap_returns_none():
    conflict = find_conflict(t(14), t(15), EXISTING)
    assert conflict is None


def test_excludes_given_booking_id():
    # Simulates editing booking #1 in place: it shouldn't conflict with itself.
    conflict = find_conflict(t(10), t(11), EXISTING, exclude_booking_id=1)
    assert conflict is None


def test_end_before_start_rejected():
    with pytest.raises(BookingValidationError):
        validate_time_window(t(11), t(10))


def test_end_equal_start_rejected():
    with pytest.raises(BookingValidationError):
        validate_time_window(t(10), t(10))


def test_outside_working_hours_rejected():
    with pytest.raises(BookingValidationError):
        validate_time_window(t(8), t(9, 30))
    with pytest.raises(BookingValidationError):
        validate_time_window(t(17), t(18, 30))


def test_exactly_working_hours_boundaries_allowed():
    validate_time_window(t(9), t(18))  # should not raise


# ---------- Part B: next available slot ----------

def test_gap_before_first_booking():
    existing = [ExistingBooking(id=1, title="A", start_time=t(10), end_time=t(11))]
    slot = compute_next_available_slot(30, existing)
    assert slot == (t(9), t(9, 30))


def test_gap_between_bookings():
    existing = [
        ExistingBooking(id=1, title="A", start_time=t(9), end_time=t(10)),
        ExistingBooking(id=2, title="B", start_time=t(10, 30), end_time=t(11)),
    ]
    slot = compute_next_available_slot(30, existing)
    assert slot == (t(10), t(10, 30))


def test_gap_after_last_booking():
    existing = [ExistingBooking(id=1, title="A", start_time=t(9), end_time=t(17))]
    slot = compute_next_available_slot(60, existing)
    assert slot == (t(17), t(18))


def test_gap_exactly_matching_duration():
    existing = [
        ExistingBooking(id=1, title="A", start_time=t(9), end_time=t(10)),
        ExistingBooking(id=2, title="B", start_time=t(10, 30), end_time=t(11)),
    ]
    # 30 minute gap, 30 minute request -> should fit exactly, not be skipped.
    slot = compute_next_available_slot(30, existing)
    assert slot == (t(10), t(10, 30))


def test_fully_booked_room_returns_none():
    existing = [ExistingBooking(id=1, title="A", start_time=t(9), end_time=t(18))]
    slot = compute_next_available_slot(15, existing)
    assert slot is None


def test_empty_room_returns_start_of_day():
    slot = compute_next_available_slot(45, [])
    assert slot == (t(9), t(9, 45))
