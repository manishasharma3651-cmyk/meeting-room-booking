"""
Centralised app configuration.

Everything environment-specific (DB url, allowed origins, working hours)
lives here so routes/services never read os.environ directly.
"""
from datetime import time

from pydantic_settings import BaseSettings, SettingsConfigDict


def _parse_hhmm(value: str) -> time:
    hour, minute = value.split(":")
    return time(hour=int(hour), minute=int(minute))


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://postgres:postgres@localhost:5432/meeting_rooms"
    cors_origins: str = "http://localhost:3000"
    work_day_start: str = "09:00"
    work_day_end: str = "18:00"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def work_start_time(self) -> time:
        return _parse_hhmm(self.work_day_start)

    @property
    def work_end_time(self) -> time:
        return _parse_hhmm(self.work_day_end)


settings = Settings()
