from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.core.dependencies import get_current_admin
from app.models.models import User, Job, Report
from app.schemas.schemas import UserOut, JobOut, ReportOut, JobModeration, UserStatusUpdate
from app.services.job_service import get_pending_jobs, moderate_job

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/jobs/pending", response_model=List[JobOut])
def list_pending_jobs(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """List all jobs awaiting moderation."""
    return get_pending_jobs(db)

@router.post("/jobs/{job_id}/moderate", response_model=JobOut)
def moderation_job(
    job_id: int,
    data: JobModeration,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Approve or reject a job posting."""
    return moderate_job(db, job_id, data.is_approved, data.rejection_reason)

@router.get("/reports", response_model=List[ReportOut])
def list_reports(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """List all job reports."""
    return db.query(Report).order_by(Report.created_at.desc()).all()

@router.patch("/users/{user_id}/status", response_model=UserOut)
def update_user_status(
    user_id: int,
    data: UserStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Activate or deactivate a user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = data.is_active
    db.commit()
    db.refresh(user)
    return user
