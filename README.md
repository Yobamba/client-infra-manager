# Client Infrastructure Manager

A full-stack infrastructure management platform for organizing **clients, projects, and Odoo instances**, with strict role-based access control and production safeguards.

This system simulates a real-world internal tool used by infrastructure teams to manage multi-client environments safely and efficiently.

---

# Overview

This application provides a centralized interface to:

- Manage clients and their projects
- Create and control Odoo instances (Production, Staging, Development)
- Assign users to projects
- Enforce business rules at the API level
- Secure access via JWT authentication and role-based permissions

The system is built using modern frontend technologies with a structured FastAPI backend.

---

# Core Features

## Client Management

Create and manage clients that group multiple projects.

## Project Management

Projects belong to a single client and can contain multiple infrastructure instances.

## Odoo Instance Management

Each project can have multiple instances with types:

- PRODUCTION
- STAGING
- DEVELOPMENT

### Critical Business Rule

Each project may have **only one active PRODUCTION instance**.

This rule is enforced server-side to prevent conflicts and maintain infrastructure integrity.

## User Authentication & Authorization

- JWT-based authentication
- Two roles:
  - ADMIN
  - STANDARD

### ADMIN Capabilities

- Manage clients, projects, users, and instances
- Assign and remove users from projects
- Create/update/delete instances

### STANDARD User Capabilities

- View only assigned projects
- View instances within assigned projects
- Cannot access administrative functionality

Authorization is enforced both:

- On the backend (security layer)
- On the frontend (conditional rendering and route protection)

---

# Tech Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn UI
- Axios

## Backend

- FastAPI
- SQLAlchemy ORM
- SQLite (configurable)
- JWT Authentication

---

<!-- # Architecture

The project follows a clean separation between frontend and backend concerns.

## Backend Structure -->

Key design decisions:

- Many-to-many relationship between Users and Projects
- Business rules enforced in service layer (not frontend)
- Clear RESTful endpoint design
- Validation and error handling via HTTP exceptions

## Setup and Installation

### Backend

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Yobamba/client-infra-manager.git
    cd client-infra-manager
    ```
2.  **Set up a Python virtual environment**:
    ```bash
    python -m venv venv
    # Activate the environment:
    # On Windows:
    .\venv\Scripts\activate
    # On macOS/Linux:
    # source venv/bin/activate
    ```
3.  **Install backend dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

### Frontend

1.  **Navigate to the frontend directory**:
    ```bash
    cd odoo-manager-frontend
    ```
2.  **Install frontend dependencies**:
    ```bash
    npm install
    # or
    # yarn install
    ```

## Running the Application

### Backend

1. **Ensure your .env file is properly configured** - You need the environment variables:
   - `DATABASE_URL`
   - `SECRET_KEY`
   - `ALGORITHM`
   - `ACCESS_TOKEN_EXPIRE_MINUTES`
2. **Start the backend server**: Use `uvicorn app.main:app --reload`
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend

1.  **Start the frontend development server**:
    ```bash
    # Navigate to the frontend directory first
    cd odoo-manager-frontend
    # Then run:
    npm run dev
    # or
    # yarn dev
    ```
    The frontend will typically be available at `http://localhost:5173` (or a similar port, as configured by Vite).
