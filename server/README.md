# Backend Service (FastAPI)

This directory contains the REST API server built using **FastAPI**, **SQLAlchemy**, and **PostgreSQL**.

---

## Architecture

* **`app/main.py`** - FastAPI app initialization, middleware configuration (CORS), and router inclusion.
* **`app/db/`** - Database configuration (`database.py`) and SQLAlchemy ORM models (`models.py`).
* **`app/routes/`** - HTTP route controllers organized by domain (`auth.py`, `leads.py`, `users.py`).
* **`app/services/`** - Core business logic and database querying functions (`lead_service.py`, etc.).
* **`app/schemas/`** - Pydantic data validation and serialization models.
* **`app/utils/`** - Helper utilities such as JWT handling and password hashing (`security.py`).

---

## Quick Setup & Running

1. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Populate database and seed test accounts:
   ```bash
   python seed_users.py
   python seed_leads.py
   ```

4. Start development server:
   ```bash
   uvicorn app.main:app --reload
   ```
