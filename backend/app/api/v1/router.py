from fastapi import APIRouter
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.jobs import router as jobs_router
from app.api.v1.endpoints.applications import router as applications_router
from app.api.v1.endpoints.analytics import analytics_router, skills_router
from app.api.v1.endpoints.admin import router as admin_router
from app.api.v1.endpoints.notifications import router as notifications_router
from app.api.v1.endpoints.chat import router as chat_router
from app.api.v1.endpoints.assessments import router as assessments_router

from app.api.v1.endpoints.payments import router as payments_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(jobs_router)
api_router.include_router(applications_router)
api_router.include_router(analytics_router)
api_router.include_router(skills_router)
api_router.include_router(admin_router)
api_router.include_router(notifications_router)
api_router.include_router(chat_router)
api_router.include_router(assessments_router)
api_router.include_router(payments_router)
