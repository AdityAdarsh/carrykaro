from pydantic import BaseModel
from enum import Enum
from typing import Optional
from datetime import date, datetime


class TravelMode(str, Enum):
    flight = "flight"
    train = "train"
    bus = "bus"
    car = "car"
    other = "other"


class TripStatus(str, Enum):
    open = "open"
    matched = "matched"
    completed = "completed"
    cancelled = "cancelled"


class TripCreate(BaseModel):
    from_city: str
    to_city: str
    travel_date: date
    travel_mode: TravelMode
    capacity_kg: float
    earning_range_min: int
    earning_range_max: int
    is_stub: bool = False


class Trip(TripCreate):
    id: str
    user_id: str
    status: TripStatus = TripStatus.open
    created_at: datetime
