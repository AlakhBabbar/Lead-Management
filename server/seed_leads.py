import os
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine, Base
from app.db.models import User, Lead, Note, ActivityLog, LeadStatus

# Pre-defined realistic dummy data
FIRST_NAMES = ["Alice", "Bob", "Charlie", "Diana", "Ethan", "Fiona", "George", "Hannah", "Ian", "Julia", "Kevin", "Luna", "Mason", "Nora", "Oliver", "Penelope"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez"]
COMPANIES = ["Acme Corp", "Globex", "Initech", "Umbrella Corp", "Stark Industries", "Wayne Enterprises", "Cyberdyne", "Hooli", "Massive Dynamic", "Pied Piper", "Dunder Mifflin", "Vandelay Industries", "Soylent", "Goliath National Bank"]
MESSAGES = [
    "Looking for a custom enterprise solution.",
    "Need pricing for a team of 50.",
    "Interested in a demo of your new features.",
    "We are migrating from a competitor and need assistance.",
    "Can you send over the API documentation?",
    "We need to discuss SLA options for a massive deployment.",
    "Just browsing, but might need this next quarter.",
    "Urgent: Need to implement a solution by end of month."
]
NOTE_CONTENTS = [
    "Called them, left a voicemail.",
    "Emailed the pricing deck. Waiting for response.",
    "Client is very interested but budget is tight.",
    "Meeting scheduled for next Tuesday.",
    "They are looking at our competitors too. Need to act fast.",
    "Followed up, they need more time to decide.",
    "Great call! They are pushing this to procurement.",
    "Radio silence. Will try one more time next week."
]

def generate_leads():
    db: Session = SessionLocal()
    
    try:
        # 1. Fetch only VERIFIED users
        verified_users = db.query(User).filter(User.is_verified == True).all()
        
        if not verified_users:
            print("❌ No verified users found! Please run 'seed_users.py' first.")
            return

        print(f"Found {len(verified_users)} verified users. Generating 35 leads...")

        for _ in range(35):
            # Base creation date: anywhere from 60 days ago to 2 days ago
            lead_creation_date = datetime.utcnow() - timedelta(days=random.randint(2, 60))
            current_time_cursor = lead_creation_date
            
            # --- 1. Create the Lead ---
            first_name = random.choice(FIRST_NAMES)
            last_name = random.choice(LAST_NAMES)
            company = random.choice(COMPANIES)
            
            lead = Lead(
                name=f"{first_name} {last_name}",
                email=f"{first_name.lower()}.{last_name.lower()}@{company.lower().replace(' ', '')}.com",
                phone=f"+1 (555) {random.randint(100, 999)}-{random.randint(1000, 9999)}",
                company=company,
                message=random.choice(MESSAGES),
                status=LeadStatus.NEW,
                created_at=current_time_cursor
            )
            db.add(lead)
            db.commit()
            db.refresh(lead)

            # Log Lead Creation
            creation_log = ActivityLog(
                action="LEAD_CREATED",
                details="Lead captured via public form.",
                created_at=current_time_cursor,
                lead_id=lead.id
            )
            db.add(creation_log)
            db.commit()
            db.refresh(creation_log)

            all_logs_for_this_lead = [creation_log]

            # --- 2. Simulate the Journey ---
            # Randomly decide how far this lead gets in the pipeline
            target_status = random.choices(
                [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED, LeadStatus.WON, LeadStatus.LOST],
                weights=[10, 20, 30, 25, 15], # Weighted probabilities
                k=1
            )[0]

            # Randomly Assign (80% chance it gets assigned)
            if random.random() > 0.2:
                current_time_cursor += timedelta(hours=random.randint(1, 48)) # Advance time
                assignee = random.choice(verified_users)
                lead.assigned_to = assignee.id
                
                assign_log = ActivityLog(
                    action="LEAD_UPDATED",
                    details=f"Lead assigned to {assignee.first_name}",
                    created_at=current_time_cursor,
                    lead_id=lead.id
                )
                db.add(assign_log)
                db.commit()
                db.refresh(assign_log)
                all_logs_for_this_lead.append(assign_log)

            # Move through statuses if it's past NEW
            statuses_to_traverse = []
            if target_status != LeadStatus.NEW:
                statuses_to_traverse.append(LeadStatus.CONTACTED)
                if target_status in [LeadStatus.QUALIFIED, LeadStatus.WON, LeadStatus.LOST]:
                    statuses_to_traverse.append(LeadStatus.QUALIFIED)
                if target_status in [LeadStatus.WON, LeadStatus.LOST]:
                    statuses_to_traverse.append(target_status)

            for status in statuses_to_traverse:
                current_time_cursor += timedelta(days=random.randint(1, 5))
                old_status = lead.status
                lead.status = status
                
                status_log = ActivityLog(
                    action="LEAD_UPDATED",
                    details=f"Status changed from {old_status.value} to {status.value}",
                    created_at=current_time_cursor,
                    lead_id=lead.id
                )
                db.add(status_log)
                db.commit()
                db.refresh(status_log)
                all_logs_for_this_lead.append(status_log)

            # --- 3. Generate Notes ---
            # General Notes (Not linked to an activity)
            for _ in range(random.randint(0, 2)):
                current_time_cursor += timedelta(hours=random.randint(1, 12))
                author = random.choice(verified_users)
                general_note = Note(
                    content=random.choice(NOTE_CONTENTS),
                    created_at=current_time_cursor,
                    lead_id=lead.id,
                    user_id=author.id
                )
                db.add(general_note)
                
                g_note_log = ActivityLog(
                    action="GENERAL_NOTE_ADDED",
                    details="A general note was added to the lead.",
                    created_at=current_time_cursor,
                    lead_id=lead.id
                )
                db.add(g_note_log)
                db.commit()

            # Linked Notes (Attached to an existing activity log)
            for _ in range(random.randint(0, 3)):
                # Pick a random log that already happened for this lead
                target_log = random.choice(all_logs_for_this_lead)
                
                # The note happens slightly after the activity it refers to
                note_time = target_log.created_at + timedelta(minutes=random.randint(5, 120))
                author = random.choice(verified_users)
                
                linked_note = Note(
                    content=random.choice(NOTE_CONTENTS),
                    created_at=note_time,
                    lead_id=lead.id,
                    user_id=author.id,
                    activity_log_id=target_log.id
                )
                db.add(linked_note)
                db.commit()

        print("✅ Successfully seeded 35 realistic leads with dynamic histories and notes!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    generate_leads()