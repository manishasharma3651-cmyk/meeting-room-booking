from datetime import date as date_type

from sqlalchemy.orm import Session

from app import models
from app.services.booking_logic import ExistingBooking


def get_rooms(db: Session) -> list[models.Room]:
    return db.query(models.Room).order_by(models.Room.name).all()


def get_room(db: Session, room_id: int) -> models.Room | None:
    return db.query(models.Room).filter(models.Room.id == room_id).first()


def get_bookings_for_room_on_date(
    db: Session, room_id: int, on_date: date_type
) -> list[models.Booking]:
    return (
        db.query(models.Booking)
        .filter(models.Booking.room_id == room_id, models.Booking.date == on_date)
        .order_by(models.Booking.start_time)
        .all()
    )


def get_bookings_for_date(
    db: Session, on_date: date_type, room_id: int | None = None
) -> list[models.Booking]:
    query = db.query(models.Booking).filter(models.Booking.date == on_date)
    if room_id is not None:
        query = query.filter(models.Booking.room_id == room_id)
    return query.order_by(models.Booking.room_id, models.Booking.start_time).all()


def to_existing_booking(booking: models.Booking) -> ExistingBooking:
    """Adapt an ORM row to the plain dataclass the pure logic layer expects."""
    return ExistingBooking(
        id=booking.id,
        title=booking.title,
        start_time=booking.start_time,
        end_time=booking.end_time,
    )


def create_booking(db: Session, **fields) -> models.Booking:
    booking = models.Booking(**fields)
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


def get_booking(db: Session, booking_id: int) -> models.Booking | None:
    return db.query(models.Booking).filter(models.Booking.id == booking_id).first()


def delete_booking(db: Session, booking: models.Booking) -> None:
    db.delete(booking)
    db.commit()
