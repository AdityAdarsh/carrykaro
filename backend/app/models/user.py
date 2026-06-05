from pydantic import BaseModel
from enum import Enum
from typing import Optional
from datetime import datetime


class UserRole(str, Enum):
    sender = "sender"
    traveller = "traveller"


class KYCStatus(str, Enum):
    not_started = "not_started"
    pending = "pending"
    verified = "verified"
    failed = "failed"


class UserProfile(BaseModel):
    id: str
    phone: Optional[str] = None
    email: Optional[str] = None
    name: str
    city: Optional[str] = None
    role: UserRole
    kyc_status: KYCStatus = KYCStatus.not_started
    kyc_provider_ref: Optional[str] = None
    created_at: datetime


class UserProfileCreate(BaseModel):
    name: str
    city: Optional[str] = None
    role: UserRole


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    role: Optional[UserRole] = None
    phone: Optional[str] = None
    email: Optional[str] = None
