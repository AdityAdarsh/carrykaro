from pydantic import BaseModel
from datetime import datetime


class MessageCreate(BaseModel):
    match_id: str
    content: str


class Message(MessageCreate):
    id: str
    sender_id: str
    created_at: datetime
