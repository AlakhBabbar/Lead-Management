from sqlalchemy import Column, Integer, String, Boolean, ForeignKey,Uuid, DateTime, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .database import Base
import uuid

# Enums for strict value constraints
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MEMBER = "member"

class LeadStatus(str, enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    WON = "won"
    LOST = "lost"

class User(Base):
    __tablename__ = "users"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    first_name = Column(String, nullable=False) # New field
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.MEMBER, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False) # New flag

    # Relationships
    assigned_leads = relationship("Lead", back_populates="assignee")
    notes = relationship("Note", back_populates="author")

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    email = Column(String, index=True, nullable=False)
    phone = Column(String, nullable=True)
    company = Column(String, nullable=True)
    message = Column(Text, nullable=True)
    status = Column(SQLEnum(LeadStatus), default=LeadStatus.NEW, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    assigned_to = Column(Uuid, ForeignKey("users.id"), nullable=True)

    # Relationships
    assignee = relationship("User", back_populates="assigned_leads")
    notes = relationship("Note", back_populates="lead")
    activities = relationship("ActivityLog", back_populates="lead")

class Note(Base):
    __tablename__ = "notes"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    lead_id = Column(Uuid, ForeignKey("leads.id"), nullable=False)
    user_id = Column(Uuid, ForeignKey("users.id"), nullable=False)
    activity_log_id = Column(Uuid, ForeignKey("activity_logs.id"), nullable=True)
  

    # Relationships
    lead = relationship("Lead", back_populates="notes")
    author = relationship("User", back_populates="notes")
    activity = relationship("ActivityLog", back_populates="notes")

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    action = Column(String, nullable=False) # e.g., "STATUS_CHANGED", "NOTE_ADDED"
    details = Column(Text, nullable=True)   # e.g., "Status changed from New to Contacted"
    created_at = Column(DateTime, default=datetime.utcnow)
    
    lead_id = Column(Uuid, ForeignKey("leads.id"), nullable=False)

    # Relationships
    lead = relationship("Lead", back_populates="activities")
    notes = relationship("Note", back_populates="activity")