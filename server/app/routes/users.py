from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.db.models import User
from app.schemas.user import UserResponse
from app.utils.deps import get_current_admin
import uuid

# Notice we use get_current_admin as a dependency for the ENTIRE router.
# This enforces that NO ONE except an admin can access these endpoints.
router = APIRouter(
    prefix="/api/users", 
    tags=["User Management"],
    dependencies=[Depends(get_current_admin)]
)

@router.get("/pending", response_model=List[UserResponse])
def get_pending_users(db: Session = Depends(get_db)):
    """Fetch all users who are waiting for approval."""
    pending_users = db.query(User).filter(User.is_verified == False).all()
    return pending_users

@router.put("/{user_id}/approve", response_model=UserResponse)
def approve_user(user_id: uuid.UUID, db: Session = Depends(get_db)):
    """Approve an unverified user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_verified:
        raise HTTPException(status_code=400, detail="User is already verified")
        
    user.is_verified = True
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
def delete_pending_user(user_id: uuid.UUID, db: Session = Depends(get_db)):
    """Delete an unverified user account request."""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User not found"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "User request removed successfully"}


@router.get("/approved", response_model=List[UserResponse])
def get_verified_users(db: Session = Depends(get_db)):
    """Fetch all verified team members available for lead assignment."""
    verified_users = db.query(User).filter(User.is_verified == True).all()
    return verified_users