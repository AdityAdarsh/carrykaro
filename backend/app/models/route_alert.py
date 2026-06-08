from pydantic import BaseModel
from typing import Literal


class RouteAlertCreate(BaseModel):
    from_city: str
    to_city: str
    looking_for: Literal['request', 'trip']
