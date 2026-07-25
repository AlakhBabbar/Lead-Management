from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
import jwt
from app.db.database import get_db
from app.db.models import User, UserRole
from app.utils.security import SECRET_KEY, ALGORITHM
import uuid

def get_token_from_cookie(request: Request) -> str:
    """Extracts the JWT from the HttpOnly cookie."""
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Not authenticated"
        )
    return token

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Decodes the JWT and retrieves the user from the database."""
    token = get_token_from_cookie(request)
    try:
        # We stored the user ID in the "sub" (subject) claim
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    return user

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Throws a 403 error if the user is not an Admin."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Admin privileges required"
        )
    return current_user