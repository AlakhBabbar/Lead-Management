from typing import List, Optional
import uuid

from sqlalchemy.orm import Session
from app.db.models import Lead, ActivityLog, LeadStatus, Note, User, UserRole
from app.schemas.lead import LeadCreate, LeadUpdate, NoteCreate

def create_public_lead(db: Session, lead_data: LeadCreate) -> Lead:
    # 1. Create the Lead
    new_lead = Lead(
        name=lead_data.name,
        email=lead_data.email,
        phone=lead_data.phone,
        company=lead_data.company,
        message=lead_data.message,
        status=LeadStatus.NEW
    )
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)
    
    # 2. Auto-generate the Activity Log[cite: 1]
    activity = ActivityLog(
        action="LEAD_CREATED",
        details="Lead captured via public form.",
        lead_id=new_lead.id
    )
    db.add(activity)
    db.commit()
    
    return new_lead

def get_all_leads(
    db: Session, 
    user: User, 
    page: int = 1, 
    limit: int = 20, 
    status: Optional[LeadStatus] = None, 
    assigned_to: Optional[uuid.UUID] = None
) -> List[Lead]:
    
    query = db.query(Lead)
    
    # Role-based filtering: Members only see their own leads
    if user.role == UserRole.MEMBER:
        query = query.filter(Lead.assigned_to == user.id)
    elif assigned_to:
        query = query.filter(Lead.assigned_to == assigned_to)
        
    # Optional status filtering
    if status:
        query = query.filter(Lead.status == status)
        
    # Pagination
    offset = (page - 1) * limit
    return query.offset(offset).limit(limit).all()

def update_lead_details(db: Session, lead: Lead, lead_update: LeadUpdate) -> Lead:
    changes = []
    
    if lead_update.status and lead_update.status != lead.status:
        changes.append(f"Status changed from {lead.status.value} to {lead_update.status.value}")
        lead.status = lead_update.status
        
    if lead_update.assigned_to and lead_update.assigned_to != lead.assigned_to:
        changes.append(f"Lead assigned to user {lead_update.assigned_to}")
        lead.assigned_to = lead_update.assigned_to
        
    if changes:
        db.commit()
        # Auto-generate activity logs for every change
        for change in changes:
            log = ActivityLog(action="LEAD_UPDATED", details=change, lead_id=lead.id)
            db.add(log)
        db.commit()
        db.refresh(lead)
        
    return lead

def create_lead_note(db: Session, lead_id: uuid.UUID, user_id: uuid.UUID, note_data: NoteCreate) -> Note:
    new_note = Note(content=note_data.content, lead_id=lead_id, user_id=user_id)
    db.add(new_note)
    
    # Auto-generate activity log for the note[cite: 1]
    log = ActivityLog(action="NOTE_ADDED", details="A new note was added to the lead.", lead_id=lead_id)
    db.add(log)
    
    db.commit()
    db.refresh(new_note)
    return new_note