from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db.database import engine, Base
from .routes import auth, health, leads, users

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Lead Management API",
    description="API for managing sales leads, notes, and activities.",
    version="1.0.0"
)

# CORS Configuration for HTTP-only cookies
app.add_middleware(
    CORSMiddleware,
    # In production, replace with your frontend Vercel URL
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routes
app.include_router(auth.router)
app.include_router(health.router)
app.include_router(users.router)
app.include_router(leads.router) # We will create this file in a moment

@app.get("/")
def read_root():
    return {"message": "Lead Management API is running"}