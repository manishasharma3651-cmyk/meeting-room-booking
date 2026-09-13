from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db
from app.services.booking_logic import compute_next_available_slot

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


@router.get("", response_model=list[schemas.RoomOut])
def list_rooms(db: Session = Depends(get_db)):
    return crud.get_rooms(db)


@router.get("/with-bookings", response_model=list[schemas.RoomWithBookings])
def list_rooms_with_bookings(
    date: date_type = Query(..., description="Day to view bookings for"),
    room_id: int | None = Query(default=None, description="Optionally filter to one room"),
    db: Session = Depends(get_db),
):
    """
    Powers the main calendar view: every room (optionally filtered to one),
    each with just that day's bookings attached, in a single round trip.
    """
    rooms = crud.get_rooms(db)
    if room_id is not None:
        rooms = [r for r in rooms if r.id == room_id]
        if not rooms:
            raise HTTPException(status_code=404, detail="Room not found.")

    result = []
    for room in rooms:
        bookings = crud.get_bookings_for_room_on_date(db, room.id, date)
        result.append(
            schemas.RoomWithBookings(
                id=room.id,
                name=room.name,
                capacity=room.capacity,
                location=room.location,
                bookings=[schemas.BookingOut.model_validate(b) for b in bookings],
            )
        )
    return result


@router.get("/{room_id}/next-available", response_model=schemas.NextAvailableOut)
def next_available(
    room_id: int,
    date: date_type = Query(..., description="Day to search within"),
    duration: int = Query(..., gt=0, le=9 * 60, description="Duration in minutes"),
    db: Session = Depends(get_db),
):
    room = crud.get_room(db, room_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found.")

    existing = [
        crud.to_existing_booking(b)
        for b in crud.get_bookings_for_room_on_date(db, room_id, date)
    ]
    slot = compute_next_available_slot(duration, existing)

    if slot is None:
        return schemas.NextAvailableOut(
            room_id=room_id,
            date=date,
            duration_minutes=duration,
            available=False,
            message=(
                f"No {duration}-minute slot is free in {room.name} on {date}. "
                "The room is fully booked for the rest of the day."
            ),
        )

    start_time, end_time = slot
    return schemas.NextAvailableOut(
        room_id=room_id,
        date=date,
        duration_minutes=duration,
        available=True,
        start_time=start_time,
        end_time=end_time,
        message=f"Next available: {start_time.strftime('%H:%M')}-{end_time.strftime('%H:%M')} in {room.name}.",
    )
