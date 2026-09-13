from sqlalchemy import Column, Date, ForeignKey, Integer, String, Time
from sqlalchemy.orm import relationship

from app.database import Base


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    capacity = Column(Integer, nullable=False, default=4)
    location = Column(String(100), nullable=True)

    bookings = relationship(
        "Booking", back_populates="room", cascade="all, delete-orphan"
    )


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(
        Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title = Column(String(200), nullable=False)
    booked_by = Column(String(120), nullable=True)

    # Stored as separate date + time columns (rather than two timestamps)
    # because every query and conflict check in this app is naturally
    # "same room, same day" -- indexing (room_id, date) keeps that path fast
    # and keeps start/end trivially comparable as plain times.
    date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    room = relationship("Room", back_populates="bookings")


# Composite index: nearly every read in this app is "bookings for room X on date Y".
from sqlalchemy import Index  # noqa: E402

Index("ix_bookings_room_date", Booking.room_id, Booking.date)
