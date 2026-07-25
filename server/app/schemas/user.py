from pydantic import BaseModel, EmailStr
from app.db.models import UserRole
import uuid

# Shape of data for the new Sign-up flow
class UserCreate(BaseModel):
    first_name: str
    email: EmailStr
    password: str
    role: UserRole

# Shape of data returned to the client
class UserResponse(BaseModel):
    id: uuid.UUID
    first_name: str
    email: EmailStr
    role: UserRole
    is_verified: bool

    class Config:
        from_attributes = True