from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os

from app.core.config import settings
from app.api.v1.router import api_router
from app.db.session import engine
from app.models.models import Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    await seed_skills()
    yield


async def seed_skills():
    from app.db.session import SessionLocal
    from app.models.models import Skill
    db = SessionLocal()
    try:
        if db.query(Skill).count() == 0:
            default_skills = [
                ("Python", "Backend"), ("JavaScript", "Frontend"), ("TypeScript", "Frontend"),
                ("React", "Frontend"), ("Vue.js", "Frontend"), ("Angular", "Frontend"),
                ("Node.js", "Backend"), ("FastAPI", "Backend"), ("Django", "Backend"),
                ("Flask", "Backend"), ("PostgreSQL", "Database"), ("MySQL", "Database"),
                ("MongoDB", "Database"), ("Redis", "Database"), ("Docker", "DevOps"),
                ("Kubernetes", "DevOps"), ("AWS", "Cloud"), ("GCP", "Cloud"),
                ("Azure", "Cloud"), ("Git", "Tools"), ("GraphQL", "API"),
                ("REST API", "API"), ("Machine Learning", "AI/ML"), ("Deep Learning", "AI/ML"),
                ("TensorFlow", "AI/ML"), ("PyTorch", "AI/ML"), ("Java", "Backend"),
                ("Go", "Backend"), ("Rust", "Backend"), ("C++", "Backend"),
                ("Swift", "Mobile"), ("Kotlin", "Mobile"), ("React Native", "Mobile"),
                ("Flutter", "Mobile"), ("CSS", "Frontend"), ("Tailwind CSS", "Frontend"),
                ("SQL", "Database"), ("Linux", "DevOps"), ("CI/CD", "DevOps"),
                ("Figma", "Design"), ("UI/UX", "Design"), ("Agile", "Management"),
                ("Scrum", "Management"), ("Product Management", "Management"),
                ("Data Analysis", "Analytics"), ("Tableau", "Analytics"),
            ]
            for name, category in default_skills:
                db.add(Skill(name=name, category=category))
            db.commit()
    finally:
        db.close()


from app.core.limiter import limiter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="A full-stack Job Portal API with JWT auth, role-based access, job search, and more.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    redirect_slashes=False,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

from fastapi.exceptions import RequestValidationError
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print(f"Validation Error: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(api_router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}


@app.get("/health", tags=["Health"])
def health():
    return JSONResponse({"status": "healthy"})
