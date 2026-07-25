from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.db.models import LeadStatus
import uuid

# --- Activity Log ---
class ActivityLogResponse(BaseModel):
    id: uuid.UUID
    action: str
    details: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Notes ---
class NoteCreate(BaseModel):
    content: str

class NoteResponse(BaseModel):
    id: uuid.UUID
    content: str
    created_at: datetime
    id: uuid.UUID
    
    class Config:
        from_attributes = True

# --- Leads ---
# The public capture form will use this schema
class LeadCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    message: Optional[str] = None

# Internal team members will use this to update status or assignment
class LeadUpdate(BaseModel):
    status: Optional[LeadStatus] = None
    assigned_to: Optional[uuid.UUID] = None

# The complete lead object returned to the frontend dashboard
class LeadResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    phone: Optional[str]
    company: Optional[str]
    message: Optional[str]
    status: LeadStatus
    created_at: datetime
    assigned_to: Optional[uuid.UUID]
    
    # Nested relationships
    notes: List[NoteResponse] = []
    activities: List[ActivityLogResponse] = []

    class Config:
        from_attributes = True