from app.db.database import SessionLocal
from app.db.models import User, UserRole
from app.utils.security import get_password_hash

def seed_admin():
    db = SessionLocal()
    admin_email = "admin@example.com"
    
    # Check if admin already exists
    if not db.query(User).filter(User.email == admin_email).first():
        admin = User(
            email=admin_email,
            password_hash=get_password_hash("admin123"),
            role=UserRole.ADMIN
        )
        db.add(admin)
        db.commit()
        print(f"Admin user created: {admin_email} / admin123")
    else:
        print("Admin user already exists.")
        
    db.close()

if __name__ == "__main__":
    seed_admin()