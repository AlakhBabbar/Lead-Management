# Prospectly : CRM & Lead Management System

A full-stack, production-ready CRM and Lead Management application built with a modern tech stack. It features role-based access control, dynamic server-side pagination, interactive serpentine (S-curve) activity timelines with threaded notes, and real-time URL state synchronization.

---

## Tech Stack

* **Frontend:** React (Vite), Tailwind CSS, Lucide React, React Router
* **Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL
* **Authentication:** JWT (JSON Web Tokens), Secure Password Hashing (Bcrypt)

---

## Project Structure

```text
Directory structure:
└── alakhbabbar-lead-management/
    ├── client/
    │   ├── README.md
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package.json
    │   ├── tsconfig.app.json
    │   ├── tsconfig.json
    │   ├── tsconfig.node.json
    │   ├── vite.config.ts
    │   └── src/
    │       ├── App.css
    │       ├── App.tsx
    │       ├── index.css
    │       ├── main.tsx
    │       ├── api/
    │       │   └── axios.ts
    │       ├── components/
    │       │   ├── LeadSlideOver.tsx
    │       │   ├── Navbar.tsx
    │       │   └── ProtectedRoutes.tsx
    │       ├── context/
    │       │   └── AuthContext.tsx
    │       └── pages/
    │           ├── Dashboard.tsx
    │           ├── LeadDetails.tsx
    │           ├── Login.tsx
    │           ├── PublicForm.tsx
    │           ├── Signup.tsx
    │           └── TeamManagement.tsx
    └── server/
        ├── requirements.txt
        ├── app/
        │   ├── __init__.py
        │   ├── main.py
        │   ├── db/
        │   │   ├── __init__.py
        │   │   ├── database.py
        │   │   └── models.py
        │   ├── routes/
        │   │   ├── __init__.py
        │   │   ├── auth.py
        │   │   ├── health.py
        │   │   ├── leads.py
        │   │   └── users.py
        │   ├── schemas/
        │   │   ├── __init__.py
        │   │   ├── lead.py
        │   │   └── user.py
        │   ├── services/
        │   │   ├── __init__.py
        │   │   ├── auth_service.py
        │   │   └── lead_service.py
        │   └── utils/
        │       ├── __init__.py
        │       ├── deps.py
        │       └── security.py
        └── tests/
            ├── __init__.py
            ├── conftest.py
            ├── test_auth.py
            ├── test_flows.py
            └── test_leads.py

```

---

## Getting Started & Setup Guide

### Prerequisites

* Python 3.10+
* Node.js & npm
* PostgreSQL Database

### 1. Backend Setup (`/server`)

Navigate to the server directory, set up your virtual environment, and install dependencies:

```bash
cd server
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file inside the `server/` folder with your configuration:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/your_db_name
SECRET_KEY=your_super_secret_jwt_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

Run the database seeders to populate initial demo users and leads:

```bash
python seed_users.py
python seed_leads.py
```

Start the FastAPI development server:

```bash
uvicorn app.main:app --reload
```

The backend API will run at `http://localhost:8000`.

### 2. Frontend Setup (`/client`)

Open a new terminal window, navigate to the client directory, and install dependencies:

```bash
cd client
npm install
```

Create a `.env` file inside the `client/` folder:

```env
VITE_API_URL=http://localhost:8000/api
```

Start the Vite development server:

```bash
cd client
npm run dev
```

The app will run at `http://localhost:5173`.

---

## Demo Credentials

You can use the following pre-seeded accounts to test the application. (Password for all accounts is **`Password123!`**):

### Verified Admin Accounts

* **Email:** `admin1@test.com`
* **Email:** `admin2@test.com`

### Verified Member Accounts

* **Email:** `member1@test.com`
* **Email:** `member2@test.com`



---

## API Endpoints Reference

### Authentication (`/api/auth`)

* `POST /api/auth/signup` - Register a new user account (defaults to pending verification).
* `POST /api/auth/login` - Authenticate and issue an HttpOnly JWT cookie.
* `POST /api/auth/logout` - Clear session cookie.
* `GET /api/auth/me` - Get currently authenticated user profile.

### Leads Management (`/api/leads`)

* `GET /api/leads/` - Fetch paginated leads (Supports query parameters: `page`, `limit`, `search`, `status`, `sort`, `assigned_to`).
* `POST /api/leads/` - Create a new lead (Admin or automated entry).
* `GET /api/leads/{lead_id}` - Fetch a single lead by ID with fully eager-loaded activities and notes.
* `PUT /api/leads/{lead_id}` - Update lead status, details, or assignment.
* `DELETE /api/leads/{lead_id}` - Permanently delete a lead (Admin only).

### Lead Notes & Activities (`/api/leads/{lead_id}`)

* `POST /api/leads/{lead_id}/notes` - Add a note to a lead (optionally linked to an `activity_log_id`).

### User & Team Management (`/api/users`)

* `GET /api/users/pending` - Fetch all unverified user accounts awaiting approval (Admin only).
* `GET /api/users/approved` - Fetch all active, verified team members (Admin only).
* `PUT /api/users/{user_id}/approve` - Approve a pending user account (Admin only).
* `DELETE /api/users/{user_id}` - Reject/delete a pending user account request (Admin only).

---

## Backend Features & Best Practices

### Advanced Querying & Pagination
The backend leverages robust, dynamic querying for the leads pipeline.
* **Server-Side Pagination:** Handled efficiently using SQLAlchemy's `offset` and `limit`. The `PaginatedLeadsResponse` model ensures the frontend receives the total count and page details to render pagination controls seamlessly.
* **Dynamic Search:** Handled on the backend using `ilike` queries, allowing users to search across multiple fields (e.g., Lead Name, Company Name, and Email) concurrently.
* **Filtering and Sorting:** Managed natively via URL query parameters, translating directly into SQLAlchemy `.filter()` and `.order_by()` clauses.

### Error & Status Code Handling
The FastAPI application strictly follows RESTful principles for HTTP status codes to ensure clear client-server communication:
* **`200 OK` / `201 Created`:** Used for successful data retrieval, updates, and resource creation.
* **`400 Bad Request`:** Returned when invalid data is provided or business logic constraints are violated.
* **`401 Unauthorized`:** Triggered when JWT tokens are missing, expired, or invalid.
* **`403 Forbidden`:** Raised when an authenticated user (like a Member) tries to access Admin-only endpoints.
* **`404 Not Found`:** Returned when requesting a specific resource (lead, user) that does not exist in the database.

### Comprehensive Testing
A rigorous test suite guarantees system stability. We use `pytest` with a dedicated test database to ensure tests do not pollute development data. 
Tests are located in `server/tests/`:
* **`test_auth.py`:** Validates secure user registration, login flows, and token generation/validation.
* **`test_leads.py`:** Verifies the CRUD operations for leads and complex relational additions like notes and activities.
* **`test_flows.py`:** Tests complete, multi-step user journeys spanning across different API endpoints.
