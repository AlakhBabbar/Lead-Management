from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.lead import LeadCreate, LeadResponse
from app.services.lead_service import create_public_lead

router = APIRouter(prefix="/api/leads", tags=["Leads"])

@router.post("/public", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def submit_public_lead(lead_data: LeadCreate, db: Session = Depends(get_db)):
    """
    Public lead capture form — no login required. 
    Creates a new lead in the system with status 'NEW'.[cite: 1]
    """
    return create_public_lead(db, lead_data)