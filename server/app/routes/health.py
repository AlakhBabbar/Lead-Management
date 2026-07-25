from fastapi import APIRouter, Depends
from app.db.models import User
from app.utils.deps import get_current_user
from app.schemas.user import UserResponse

router = APIRouter(prefix="/api/health", tags=["Health"])

@router.get("/check", response_model=UserResponse)
def health_check(current_user: User = Depends(get_current_user)):
    """
    Frontend hits this endpoint to check if the user is still logged in.
    If the cookie is missing or invalid, get_current_user throws a 401 automatically.
    If valid, it returns the user's basic info (excluding password).
    """
    return current_user