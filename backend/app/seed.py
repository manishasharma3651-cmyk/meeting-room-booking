from app import models
from app.database import SessionLocal

DEFAULT_ROOMS = [
    {"name": "Aspen", "capacity": 4, "location": "2nd Floor"},
    {"name": "Birch", "capacity": 6, "location": "2nd Floor"},
    {"name": "Cedar", "capacity": 2, "location": "3rd Floor"},
    {"name": "Dogwood", "capacity": 10, "location": "3rd Floor"},
    {"name": "Elm", "capacity": 8, "location": "Ground Floor"},
    {"name": "Fir", "capacity": 4, "location": "Ground Floor"},
]


def seed_rooms() -> None:
    """Insert the default rooms only if the table is empty, so this is
    safe to call on every startup without creating duplicates."""
    db = SessionLocal()
    try:
        if db.query(models.Room).count() > 0:
            return
        db.add_all(models.Room(**room) for room in DEFAULT_ROOMS)
        db.commit()
    finally:
        db.close()
