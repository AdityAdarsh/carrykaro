from pydantic import BaseModel
from enum import Enum
from typing import Optional, List
from datetime import date, datetime


class ItemType(str, Enum):
    documents = "documents"
    electronics = "electronics"
    clothing = "clothing"
    food = "food"
    gifts = "gifts"
    medicine = "medicine"
    other = "other"


class RequestStatus(str, Enum):
    open = "open"
    matched = "matched"
    in_transit = "in_transit"
    delivered = "delivered"
    completed = "completed"
    cancelled = "cancelled"


class DeliveryRequestCreate(BaseModel):
    from_city: str
    to_city: str
    needed_by_date: date
    item_type: ItemType
    weight_kg: float
    description: str
    price_range_min: int
    price_range_max: int
    photo_urls: List[str] = []


class DeliveryRequest(DeliveryRequestCreate):
    id: str
    user_id: str
    status: RequestStatus = RequestStatus.open
    created_at: datetime
