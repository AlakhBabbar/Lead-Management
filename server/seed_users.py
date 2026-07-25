import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine, Base
from app.db.models import User, UserRole
from app.utils.security import get_password_hash

def seed_users():
    print("Wiping database and rebuilding all tables to sync schema...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    standard_password = "Password123!"
    
    users_to_create = [
        {"first_name": "Admin One", "email": "admin1@test.com", "role": UserRole.ADMIN, "is_verified": True},
        {"first_name": "Admin Two", "email": "admin2@test.com", "role": UserRole.ADMIN, "is_verified": True},
        {"first_name": "Member One", "email": "member1@test.com", "role": UserRole.MEMBER, "is_verified": True},
        {"first_name": "Member Two", "email": "member2@test.com", "role": UserRole.MEMBER, "is_verified": True},
        {"first_name": "Member Three", "email": "member3@test.com", "role": UserRole.MEMBER, "is_verified": True},
        {"first_name": "Member Four", "email": "member4@test.com", "role": UserRole.MEMBER, "is_verified": True},
        {"first_name": "Random 1", "email": "random1@test.com", "role": UserRole.ADMIN, "is_verified": False},
        {"first_name": "Scammer 1", "email": "scammer1@test.com", "role": UserRole.ADMIN, "is_verified": False},
        {"first_name": "Layedoff 1", "email": "layedoff1@test.com", "role": UserRole.MEMBER, "is_verified": False},
        {"first_name": "Empyee 1", "email": "empyee1@test.com", "role": UserRole.MEMBER, "is_verified": False},
    ]

    credentials_file = "demo_accounts_credentials.txt"
    
    try:
        with open(credentials_file, "w") as f:
            f.write("=== LEAD MANAGEMENT PLATFORM - DEMO ACCOUNTS ===\n\n")
            
            for index, u_data in enumerate(users_to_create):
                # We stagger the creation time by 2 days per user so the sorting is glaringly obvious!
                staggered_time = datetime.utcnow() - timedelta(days=index * 2)
                
                new_user = User(
                    first_name=u_data["first_name"],
                    email=u_data["email"],
                    password_hash=get_password_hash(standard_password),
                    role=u_data["role"],
                    is_verified=u_data["is_verified"],
                    created_at=staggered_time # Injecting the staggered time manually
                )
                db.add(new_user)
                
                status = "Verified (Can Login)" if u_data["is_verified"] else "Pending"
                role_str = u_data["role"].value.upper()
                
                f.write(f"Name:     {u_data['first_name']}\n")
                f.write(f"Role:     {role_str}\n")
                f.write(f"Status:   {status}\n")
                f.write(f"Email:    {u_data['email']}\n")
                f.write(f"Password: {standard_password}\n")
                f.write("-" * 45 + "\n")
            
        db.commit()
        print(f"✅ Successfully seeded database with staggered timestamps!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()