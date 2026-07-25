from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.db.database import get_db
from app.db.models import User, UserRole, Lead, LeadStatus
from app.schemas.lead import LeadCreate, LeadResponse, LeadUpdate, NoteCreate, NoteResponse, PaginatedLeadsResponse
from app.utils.deps import get_current_user, get_current_admin
from app.services.lead_service import create_public_lead, get_all_leads, update_lead_details, create_lead_note, delete_lead

router = APIRouter(prefix="/api/leads", tags=["Leads"])

@router.post("/public", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def submit_public_lead(lead_data: LeadCreate, db: Session = Depends(get_db)):
    """Public lead capture form — no login required."""
    return create_public_lead(db, lead_data)

@router.get("/", response_model=PaginatedLeadsResponse)
def fetch_leads(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    status: Optional[LeadStatus] = None,
    assigned_to: Optional[uuid.UUID] = None,
    search: Optional[str] = None,
    sort: Optional[str] = "NEWEST",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch all leads with true server-side pagination, sorting, and searching."""
    return get_all_leads(db, current_user, page, limit, status, assigned_to, search, sort)

@router.put("/{lead_id}", response_model=LeadResponse)
def modify_lead(
    lead_id: uuid.UUID, 
    lead_update: LeadUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update lead status or assignment."""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
        
    # Permission Enforcements[cite: 1]
    if current_user.role == UserRole.MEMBER:
        if lead.assigned_to != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot edit a lead not assigned to you")
        if lead_update.assigned_to is not None and lead_update.assigned_to != lead.assigned_to:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Members cannot assign leads")

    return update_lead_details(db, lead, lead_update)

@router.post("/{lead_id}/notes", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def add_note(
    lead_id: uuid.UUID, 
    note_data: NoteCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a timestamped note to a specific lead."""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
        
    # Members can only add notes to their own leads
    if current_user.role == UserRole.MEMBER and lead.assigned_to != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot add notes to a lead not assigned to you")

    return create_lead_note(db, lead_id, current_user.id, note_data)

@router.delete("/{lead_id}", status_code=status.HTTP_200_OK)
def remove_lead(
    lead_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)  # Admin-only: enforced at the dependency level
):
    """Delete a lead permanently. Admins only — Members get a 403 automatically."""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    delete_lead(db, lead)
    return {"message": "Lead deleted successfully"}