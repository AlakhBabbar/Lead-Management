from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

# Configure Passlib to strictly use Argon2
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# JWT settings (Make sure to add JWT_SECRET_KEY to your .env file)
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check if the provided password matches the Argon2 hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate an Argon2 hash from a plain text password."""
    return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    """Generate a JWT token with an expiration time.[cite: 1]"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt