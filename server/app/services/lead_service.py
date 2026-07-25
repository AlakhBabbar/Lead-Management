from sqlalchemy.orm import Session
from app.db.models import Lead, ActivityLog, LeadStatus
from app.schemas.lead import LeadCreate

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