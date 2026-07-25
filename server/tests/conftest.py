import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.database import Base, get_db
from app.db.models import User, UserRole
from app.utils.security import get_password_hash

# Use a temporary SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override the get_db dependency so routes use the test database
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Creates fresh tables before running tests and drops them after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    yield db
    db.close()

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def setup_users(db_session):
    """Seeds an Admin and a verified Member safely without duplicating."""
    
    # Check if admin exists before creating
    admin = db_session.query(User).filter(User.email == "admin@test.com").first()
    if not admin:
        admin = User(
            first_name="Admin", email="admin@test.com", 
            password_hash=get_password_hash("pass123"), 
            role=UserRole.ADMIN, is_verified=True
        )
        db_session.add(admin)
        
    # Check if member exists before creating
    member = db_session.query(User).filter(User.email == "member@test.com").first()
    if not member:
        member = User(
            first_name="Member", email="member@test.com", 
            password_hash=get_password_hash("pass123"), 
            role=UserRole.MEMBER, is_verified=True
        )
        db_session.add(member)
        
    db_session.commit()
    return {"admin": admin, "member": member}