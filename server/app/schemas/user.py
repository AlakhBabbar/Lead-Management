from pydantic import BaseModel, EmailStr
from app.db.models import UserRole
import uuid
from datetime import datetime # Make sure to import datetime

class UserCreate(BaseModel):
    first_name: str
    email: EmailStr
    password: str
    role: UserRole

class UserResponse(BaseModel):
    id: uuid.UUID
    first_name: str
    email: EmailStr
    role: UserRole
    is_verified: bool
    created_at: datetime # NEW: Expose timestamp to frontend

    class Config:
        from_attributes = True