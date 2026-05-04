from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_user, get_current_recruiter, get_current_admin
from app.models.models import User, Skill
from app.schemas.schemas import RecruiterAnalytics, AdminAnalytics, SkillOut
from app.services.analytics_service import get_recruiter_analytics, get_admin_analytics
from typing import List, Optional
from fastapi import Query

analytics_router = APIRouter(prefix="/analytics", tags=["Analytics"])
skills_router = APIRouter(prefix="/skills", tags=["Skills"])


@analytics_router.get("/recruiter", response_model=RecruiterAnalytics)
def recruiter_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):
    return get_recruiter_analytics(db, current_user.id)


@analytics_router.get("/admin", response_model=AdminAnalytics)
def admin_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return get_admin_analytics(db)


@skills_router.get("", response_model=List[SkillOut])
def list_skills(
    q: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Skill)
    if q:
        query = query.filter(Skill.name.ilike(f"%{q}%"))
    return query.order_by(Skill.name).limit(50).all()


@skills_router.post("", response_model=SkillOut, status_code=201)
def create_skill(
    name: str,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    existing = db.query(Skill).filter(Skill.name.ilike(name)).first()
    if existing:
        return existing
    skill = Skill(name=name.strip(), category=category)
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill
