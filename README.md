# 🚀 TalentFlow — Full-Stack Job Portal

A production-ready job portal built with **FastAPI + PostgreSQL + React (Vite)** featuring JWT authentication, role-based access control, advanced job search, resume uploads, application tracking, and a stunning glassmorphism UI.

---

## 📁 Project Structure

```
jobportal/
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── api/v1/
│   │   │   └── endpoints/      # auth, users, jobs, applications, analytics
│   │   ├── core/               # config, security, dependencies
│   │   ├── db/                 # SQLAlchemy session
│   │   ├── models/             # ORM models (User, Job, Application, etc.)
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Business logic layer
│   │   └── main.py             # FastAPI app factory
│   ├── alembic/                # Database migrations
│   ├── uploads/                # Uploaded resumes & avatars
│   ├── requirements.txt
│   ├── alembic.ini
│   └── .env.example
│
└── frontend/                   # React + Vite application
    ├── src/
    │   ├── api/                # Axios client & API service functions
    │   ├── components/
    │   │   ├── common/         # Reusable UI (Button, Input, Modal, JobCard...)
    │   │   └── layout/         # Navbar, Layout wrapper
    │   ├── pages/              # Route pages
    │   ├── store/              # Zustand auth store
    │   ├── styles/             # Global CSS + Tailwind
    │   └── utils/              # Types, helpers
    ├── index.html
    ├── vite.config.ts
    ├── tailwind.config.js
    └── package.json
```

---

## ✅ Features

### Backend
- **JWT Authentication** — access + refresh tokens, auto-rotation
- **Role-Based Access Control** — candidate, recruiter, admin roles
- **User Management** — registration, profile updates, avatar upload
- **Job Management** — CRUD for job postings with skills tagging
- **Advanced Job Search** — filter by location, salary, type, experience, skills, remote
- **Applications** — apply with cover letter + resume, status tracking
- **Bookmarks** — save/unsave jobs
- **Resume Upload** — PDF/DOC support with file validation
- **Analytics** — recruiter dashboard stats, application pipeline
- **Auto-seeded Skills** — 45+ tech skills seeded on startup
- **Swagger Docs** — available at `/docs`

### Frontend
- **Glassmorphism UI** — dark navy + indigo + emerald palette
- **Framer Motion** — page transitions, card animations, hover effects
- **Home Page** — animated hero, stats, featured jobs, CTA
- **Auth Pages** — login/register with role toggle (candidate/recruiter)
- **Job Search** — full-text search + multi-filter sidebar
- **Job Detail** — apply modal with cover letter + resume
- **Candidate Dashboard** — applications tracking, saved jobs, resume upload, profile
- **Recruiter Dashboard** — post jobs, view applicants, update status, analytics charts
- **Recharts** — line chart, bar chart, pie chart for analytics
- **Responsive** — fully mobile-friendly
- **Zustand** — persistent auth state
- **React Hook Form + Zod** — form validation

---

## 🛠️ Setup Guide (VS Code)

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- VS Code with Python and ESLint extensions

---

### Step 1 — Clone and open in VS Code

```bash
cd jobportal
code .
```

---

### Step 2 — Backend Setup

#### 2a. Create PostgreSQL database

Open pgAdmin or psql and run:

```sql
CREATE DATABASE jobportal;
```

#### 2b. Create Python virtual environment

In VS Code terminal:

```bash
cd backend
python -m venv venv
```

Activate it:
- **Windows:** `venv\Scripts\activate`
- **macOS/Linux:** `source venv/bin/activate`

#### 2c. Install dependencies

```bash
pip install -r requirements.txt
```

#### 2d. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/jobportal
SECRET_KEY=your-super-secret-key-at-least-32-characters-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
DEBUG=True
ALLOWED_ORIGINS=http://localhost:5173
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=5
```

#### 2e. Run database migrations (optional — tables auto-create on startup)

To use Alembic for migrations:

```bash
# Generate migration
alembic revision --autogenerate -m "initial"

# Apply migrations
alembic upgrade head
```

Or simply start the server — tables are created automatically on first run.

#### 2f. Start the FastAPI server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

✅ Backend running at: http://localhost:8000  
📚 Swagger UI: http://localhost:8000/docs  
📖 ReDoc: http://localhost:8000/redoc

---

### Step 3 — Frontend Setup

Open a **new terminal** in VS Code:

```bash
cd frontend
npm install
```

Create `.env.local` (optional, Vite proxy handles this):

```env
VITE_API_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

✅ Frontend running at: http://localhost:5173

---

## 🔑 Default Test Accounts

After starting the server, register through the UI or use the Swagger API at `/docs`:

```
POST /api/v1/auth/register
{
  "email": "candidate@test.com",
  "password": "password123",
  "full_name": "Jane Candidate",
  "role": "candidate"
}

POST /api/v1/auth/register
{
  "email": "recruiter@test.com",
  "password": "password123",
  "full_name": "John Recruiter",
  "role": "recruiter",
  "company_name": "Acme Corp"
}
```

---

## 📡 Key API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Register user | Public |
| POST | `/api/v1/auth/login` | Login | Public |
| POST | `/api/v1/auth/refresh` | Refresh token | Public |
| GET | `/api/v1/auth/me` | Current user | Required |
| GET | `/api/v1/jobs/search` | Search jobs | Optional |
| GET | `/api/v1/jobs/{id}` | Get job detail | Optional |
| POST | `/api/v1/jobs` | Create job | Recruiter |
| PATCH | `/api/v1/jobs/{id}` | Update job | Recruiter |
| DELETE | `/api/v1/jobs/{id}` | Delete job | Recruiter |
| POST | `/api/v1/jobs/{id}/bookmark` | Toggle bookmark | Required |
| GET | `/api/v1/jobs/bookmarks` | Get bookmarks | Required |
| POST | `/api/v1/applications/jobs/{id}/apply` | Apply to job | Candidate |
| GET | `/api/v1/applications/my` | My applications | Candidate |
| GET | `/api/v1/applications/jobs/{id}` | Job's applicants | Recruiter |
| PATCH | `/api/v1/applications/{id}/status` | Update status | Recruiter |
| POST | `/api/v1/users/me/resume` | Upload resume | Required |
| GET | `/api/v1/analytics/recruiter` | Recruiter stats | Recruiter |
| GET | `/api/v1/skills` | List skills | Public |

---

## 🚀 Deployment

### Backend — Railway / Render

1. Push `backend/` to GitHub
2. Set environment variables in dashboard:
   - `DATABASE_URL` (use provided PostgreSQL URL)
   - `SECRET_KEY` (generate with `openssl rand -hex 32`)
   - `ALLOWED_ORIGINS` (your Vercel frontend URL)
3. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend — Vercel

1. Push `frontend/` to GitHub
2. Import project in Vercel
3. Set environment variable:
   - `VITE_API_URL=https://your-backend.railway.app`
4. Update `vite.config.ts` proxy for production or use direct API URL in axios client

### Database — Supabase / Railway PostgreSQL

Both Railway and Supabase offer free PostgreSQL. Copy the connection string to `DATABASE_URL`.

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|------------|
| Backend Framework | FastAPI 0.111 |
| ORM | SQLAlchemy 2.0 |
| Migrations | Alembic |
| Database | PostgreSQL 14+ |
| Authentication | JWT (python-jose) |
| Password Hashing | bcrypt (passlib) |
| File Upload | python-multipart |
| Frontend Framework | React 18 + Vite 5 |
| Styling | Tailwind CSS 3 |
| Animations | Framer Motion 11 |
| State Management | Zustand 4 |
| HTTP Client | Axios |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Icons | Lucide React |
| Notifications | React Hot Toast |

---

## 📝 Development Tips

- **Hot reload** works for both frontend and backend in dev mode
- **Swagger UI** at `/docs` lets you test all endpoints with JWT auth
- Upload `uploads/` directory is served as static files at `/uploads/*`
- Skills are auto-seeded (45 common tech skills) on first startup
- The Vite proxy (`/api` → `:8000`) handles CORS in development seamlessly
- For production file storage, replace the local upload dir with S3/Cloudflare R2

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request
