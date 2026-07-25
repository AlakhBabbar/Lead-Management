import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# We will use Supabase Postgres connection string here
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL") 

# connect_args={"check_same_thread": False} is only needed for SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,   # Test each connection with a lightweight ping before using it;
                          # transparently reconnects if the DB provider dropped it while idle
    pool_recycle=300,    # Proactively recycle connections older than 5 min, before Supabase/
                          # the provider's own idle-connection timeout has a chance to kill them
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get DB session for our routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()