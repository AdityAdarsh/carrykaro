from pydantic import BaseModel
from enum import Enum
from datetime import datetime


class MatchStatus(str, Enum):
    requested = "requested"
    accepted = "accepted"
    in_transit = "in_transit"
    delivered = "delivered"
    completed = "completed"
    declined = "declined"


class MatchCreate(BaseModel):
    request_id: str
    trip_id: str


class Match(MatchCreate):
    id: str
    initiated_by: str
    status: MatchStatus = MatchStatus.requested
    created_at: datetime
