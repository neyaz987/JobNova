import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_user, get_current_candidate, get_current_recruiter
from app.models.models import User
from app.schemas.schemas import ApplicationOut, ApplicationCreate, ApplicationStatusUpdate
from app.services.application_service import (
    apply_to_job, get_candidate_applications, get_job_applications,
    update_application_status, withdraw_application, update_interview_details
)
from app.core.config import settings

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.get("/my", response_model=List[ApplicationOut])
def my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return get_candidate_applications(db, current_user.id)


@router.post("/jobs/{job_id}/apply", response_model=ApplicationOut, status_code=201)
async def apply(
    job_id: int,
    cover_letter: str = Form(None),
    resume: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_candidate),
):

    resume_url = None
    resume_filename = None

    if resume:
        ext = resume.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{ext}"
        path = os.path.join(settings.UPLOAD_DIR, "resumes", filename)
        with open(path, "wb") as f:
            f.write(await resume.read())
        resume_url = f"/uploads/resumes/{filename}"
        resume_filename = resume.filename

    data = ApplicationCreate(cover_letter=cover_letter)
    return await apply_to_job(db, job_id, current_user, data, resume_url, resume_filename)


@router.get("/jobs/{job_id}", response_model=List[ApplicationOut])
def job_applications(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):
    """Get all applications for a specific job (recruiter only)."""
    return get_job_applications(db, job_id, current_user)


@router.patch("/{app_id}/status", response_model=ApplicationOut)
def change_status(
    app_id: int,
    data: ApplicationStatusUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):

    return update_application_status(db, app_id, data, current_user, background_tasks)


@router.post("/bulk-status-update", status_code=200)
def bulk_status_update(
    app_ids: List[int],
    data: ApplicationStatusUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):

    results = []
    for app_id in app_ids:
        try:
            res = update_application_status(db, app_id, data, current_user, background_tasks)
            results.append(res)
        except Exception:
            continue
    return {"message": f"Updated {len(results)} applications"}


@router.post("/{app_id}/pick-slot", response_model=ApplicationOut)
def pick_interview_slot(
    app_id: int,
    slot_index: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_candidate),
):

    from app.services.application_service import confirm_interview_slot
    return confirm_interview_slot(db, app_id, slot_index, current_user)


@router.post("/{app_id}/withdraw", status_code=204)
def withdraw(
    app_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_candidate),
):

    withdraw_application(db, app_id, current_user)


@router.patch("/{app_id}/interview", response_model=ApplicationOut)
def schedule_interview(
    app_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):

    return update_interview_details(
        db, app_id, 
        date_str=data.get("interview_date"), 
        notes=data.get("interview_notes", ""), 
        recruiter=current_user
    )


