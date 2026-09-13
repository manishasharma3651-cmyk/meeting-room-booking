from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db
from app.services.booking_logic import (
    BookingConflictError,
    BookingValidationError,
    find_conflict,
    validate_time_window,
)

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


@router.post("", response_model=schemas.BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(payload: schemas.BookingCreate, db: Session = Depends(get_db)):
    room = crud.get_room(db, payload.room_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found.")

    try:
        validate_time_window(payload.start_time, payload.end_time)
    except BookingValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    existing = [
        crud.to_existing_booking(b)
        for b in crud.get_bookings_for_room_on_date(db, payload.room_id, payload.date)
    ]
    conflict = find_conflict(payload.start_time, payload.end_time, existing)
    if conflict is not None:
        # Wrap in the exception purely to reuse its message formatting.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=BookingConflictError(conflict).args[0],
        )

    booking = crud.create_booking(
        db,
        room_id=payload.room_id,
        title=payload.title,
        booked_by=payload.booked_by,
        date=payload.date,
        start_time=payload.start_time,
        end_time=payload.end_time,
    )
    return booking


@router.delete("/{booking_id}", status_code=status.HTTP_200_OK)
def cancel_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = crud.get_booking(db, booking_id)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found.")

    title = booking.title
    crud.delete_booking(db, booking)
    return {"detail": f"Booking '{title}' cancelled."}
