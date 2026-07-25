from typing import List, Optional
import uuid
from sqlalchemy.orm import Session
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy import or_, desc, asc
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

def get_lead_by_id(db: Session, lead_id: uuid.UUID, user: User) -> Lead:
    """Fetch a single lead by ID with eager loading and permission checks."""
    query = db.query(Lead).options(
        selectinload(Lead.activities).selectinload(ActivityLog.notes).joinedload(Note.author),
        selectinload(Lead.notes).joinedload(Note.author)
    )
    
    # Enforce role-based access control at the database query level
    if user.role == UserRole.MEMBER:
        query = query.filter(Lead.assigned_to == user.id)
        
    return query.filter(Lead.id == lead_id).first()

def get_all_leads(
    db: Session, 
    user: User, 
    page: int = 1, 
    limit: int = 25, 
    status: Optional[LeadStatus] = None, 
    assigned_to: Optional[uuid.UUID] = None,
    search: Optional[str] = None,
    sort: Optional[str] = "NEWEST"
) -> dict:
    
    # NEW: Attach options to eagerly load all nested data in bulk queries
    query = db.query(Lead).options(
        selectinload(Lead.activities).selectinload(ActivityLog.notes).joinedload(Note.author),
        selectinload(Lead.notes).joinedload(Note.author)
    )
    
    # 1. Role-based filtering
    if user.role == UserRole.MEMBER:
        query = query.filter(Lead.assigned_to == user.id)
    elif assigned_to:
        query = query.filter(Lead.assigned_to == assigned_to)
        
    # 2. Status filtering
    if status:
        query = query.filter(Lead.status == status)
        
    # 3. Search text filtering
    if search:
        query = query.filter(
            or_(
                Lead.name.ilike(f"%{search}%"),
                Lead.email.ilike(f"%{search}%"),
                Lead.company.ilike(f"%{search}%")
            )
        )

    # 4. Sorting logic
    if sort == "OLDEST":
        query = query.order_by(asc(Lead.created_at))
    elif sort == "AZ":
        query = query.order_by(asc(Lead.name))
    elif sort == "ZA":
        query = query.order_by(desc(Lead.name))
    else: # Default NEWEST
        query = query.order_by(desc(Lead.created_at))
        
    # 5. Count total matches before pagination
    total = query.count()
    
    # 6. Apply Pagination (Offset & Limit)
    offset = (page - 1) * limit
    items = query.offset(offset).limit(limit).all()
    
    total_pages = (total + limit - 1) // limit if limit > 0 else 0
    
    return {
        "data": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }

def update_lead_details(db: Session, lead: Lead, lead_update: LeadUpdate) -> Lead:
    changes = []
    
    if lead_update.status and lead_update.status != lead.status:
        changes.append(f"Status changed from {lead.status.value} to {lead_update.status.value}")
        lead.status = lead_update.status
        
    if lead_update.assigned_to and lead_update.assigned_to != lead.assigned_to:
        # Fetch the user from the database to get their actual name
        assigned_user = db.query(User).filter(User.id == lead_update.assigned_to).first()
        user_name = assigned_user.first_name if assigned_user else str(lead_update.assigned_to)
        
        changes.append(f"Lead assigned to {user_name}")
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

def delete_lead(db: Session, lead: Lead) -> None:
    """Permanently delete a lead and its related notes/activity logs.

    The models don't define ON DELETE CASCADE, so we clean up the child
    rows (Notes, ActivityLog) ourselves before deleting the Lead itself,
    otherwise this would fail with a foreign key constraint error.
    """
    db.query(Note).filter(Note.lead_id == lead.id).delete()
    db.query(ActivityLog).filter(ActivityLog.lead_id == lead.id).delete()
    db.delete(lead)
    db.commit()

def create_lead_note(db: Session, lead_id: uuid.UUID, user_id: uuid.UUID, note_data: NoteCreate) -> Note:
    new_note = Note(
        content=note_data.content, 
        lead_id=lead_id, 
        user_id=user_id,
        activity_log_id=note_data.activity_log_id 
    )
    db.add(new_note)
    
    # NEW: Log "GENERAL_NOTE_ADDED" if it is not linked to an existing activity
    if not note_data.activity_log_id:
        log = ActivityLog(
            action="GENERAL_NOTE_ADDED", 
            details="A general note was added to the lead.", 
            lead_id=lead_id
        )
        db.add(log)
    
    db.commit()
    db.refresh(new_note)
    return new_note