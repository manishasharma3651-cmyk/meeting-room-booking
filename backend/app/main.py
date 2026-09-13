import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import Base, engine
from app.routers import bookings, rooms
from app.seed import seed_rooms

logger = logging.getLogger("meeting_rooms")

app = FastAPI(
    title="Meeting Room Booking API",
    description="Book meeting rooms, detect conflicts, and find the next free slot.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    seed_rooms()


# ---- Clean error handling -------------------------------------------------
# HTTPException (400/404/409 raised deliberately in routes) is passed
# through as-is. Anything unexpected is logged server-side and turned into
# a generic 500 so stack traces never reach the client.

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Flatten Pydantic's nested error list into one readable sentence.
    first = exc.errors()[0]
    field = ".".join(str(loc) for loc in first["loc"] if loc != "body")
    message = f"{field}: {first['msg']}" if field else first["msg"]
    return JSONResponse(status_code=400, content={"detail": message})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500, content={"detail": "Something went wrong. Please try again."}
    )


app.include_router(rooms.router)
app.include_router(bookings.router)


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}
