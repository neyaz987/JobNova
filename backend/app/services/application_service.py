from sqlalchemy.orm import Session, joinedload, selectinload
from fastapi import HTTPException
from typing import List
from app.models.models import Application, Job, User, ApplicationStatus, Bookmark
from app.schemas.schemas import ApplicationCreate, ApplicationStatusUpdate, ApplicationOut
from app.services import ai_service
from app.services.email_service import EmailService


async def apply_to_job(db: Session, job_id: int, candidate: User, data: ApplicationCreate, resume_url: str = None, resume_filename: str = None) -> Application:
    job = db.query(Job).options(joinedload(Job.skills)).filter(Job.id == job_id, Job.is_active == True).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or inactive")

    existing = db.query(Application).filter_by(job_id=job_id, candidate_id=candidate.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already applied to this job")

    # Use candidate's stored resume if no new one uploaded
    if not resume_url and candidate.candidate_profile:
        resume_url = candidate.candidate_profile.resume_url
        resume_filename = candidate.candidate_profile.resume_filename

    app = Application(
        job_id=job_id,
        candidate_id=candidate.id,
        cover_letter=data.cover_letter,
        resume_url=resume_url,
        resume_filename=resume_filename,
    )
    db.add(app)
    job.applications_count = (job.applications_count or 0) + 1
    
    # AI Matching
    try:
        match_data = await ai_service.calculate_match_score(job, candidate)
        app.match_score = match_data.get("score", 0)
        app.match_reasoning = match_data.get("reasoning", "")
    except Exception as e:
        print(f"Failed to calculate match score: {e}")

    db.commit()
    db.refresh(app)

    # Send Email Notification
    EmailService.send_application_received(
        candidate_name=candidate.full_name,
        job_title=job.title,
        to_email=candidate.email
    )

    return app


def get_candidate_applications(db: Session, candidate_id: int) -> List[ApplicationOut]:
    apps = db.query(Application).options(
        joinedload(Application.job).selectinload(Job.skills)
    ).filter(Application.candidate_id == candidate_id) \
     .order_by(Application.applied_at.desc()).all()
    return [ApplicationOut.model_validate(a) for a in apps]


def get_job_applications(db: Session, job_id: int, recruiter: User) -> List[ApplicationOut]:
    job = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == recruiter.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    apps = db.query(Application).options(
        joinedload(Application.candidate).joinedload(User.candidate_profile)
    ).filter(Application.job_id == job_id) \
     .order_by(Application.applied_at.desc()).all()
    return [ApplicationOut.model_validate(a) for a in apps]


def update_application_status(db: Session, app_id: int, data: ApplicationStatusUpdate, recruiter: User) -> Application:
    app = db.query(Application).join(Job).filter(
        Application.id == app_id,
        Job.recruiter_id == recruiter.id,
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    app.status = data.status
    if data.recruiter_notes:
        app.recruiter_notes = data.recruiter_notes
    if data.proposed_slots:
        app.proposed_slots = [s.isoformat() for s in data.proposed_slots]
    if data.timezone:
        app.timezone = data.timezone
        
    db.commit()
    db.refresh(app)

    # Notify candidate
    from app.services.notification_service import create_notification
    msg = f"Your application for '{app.job.title}' has been moved to '{data.status}'."
    if data.status == ApplicationStatus.interview and data.proposed_slots:
        msg = f"Great news! Recruiter has proposed {len(data.proposed_slots)} time slots for an interview for '{app.job.title}'. Please pick one."
    
    create_notification(
        db,
        user_id=app.candidate_id,
        title="Application Update",
        message=msg,
        type="application_status",
        link=f"/candidate/dashboard"
    )

    # Send Email
    EmailService.send_status_update(
        candidate_name=app.candidate.full_name,
        job_title=app.job.title,
        status=data.status.value,
        to_email=app.candidate.email
    )

    return app


def confirm_interview_slot(db: Session, app_id: int, slot_index: int, candidate: User) -> Application:
    app = db.query(Application).filter(Application.id == app_id, Application.candidate_id == candidate.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if not app.proposed_slots or slot_index >= len(app.proposed_slots):
        raise HTTPException(status_code=400, detail="Invalid slot index")
    
    chosen_slot = app.proposed_slots[slot_index]
    from datetime import datetime
    app.interview_date = datetime.fromisoformat(chosen_slot)
    app.proposed_slots = None # Clear slots once confirmed
    
    db.commit()
    db.refresh(app)
    
    # Notify Recruiter
    from app.services.notification_service import create_notification
    create_notification(
        db,
        user_id=app.job.recruiter_id,
        title="Interview Slot Confirmed",
        message=f"{candidate.full_name} has picked a slot for '{app.job.title}' on {chosen_slot}.",
        type="interview_confirmed",
        link=f"/recruiter/dashboard"
    )
    
    return app


def withdraw_application(db: Session, app_id: int, candidate: User):
    app = db.query(Application).filter(Application.id == app_id, Application.candidate_id == candidate.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app.status = ApplicationStatus.withdrawn
    db.commit()


def update_interview_details(db: Session, app_id: int, date_str: str, notes: str, recruiter: User) -> Application:
    app = db.query(Application).join(Job).filter(
        Application.id == app_id,
        Job.recruiter_id == recruiter.id,
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    from datetime import datetime
    try:
        # Support common formats
        if 'T' in date_str:
            app.interview_date = datetime.fromisoformat(date_str.replace('Z', ''))
        else:
            app.interview_date = datetime.strptime(date_str, "%Y-%m-%d %H:%M")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD HH:MM")

    if notes:
        app.interview_notes = notes
    
    # Auto move to interview status
    app.status = ApplicationStatus.interview
    
    db.commit()
    db.refresh(app)
    
    # Notify candidate
    from app.services.notification_service import create_notification
    create_notification(
        db,
        user_id=app.candidate_id,
        title="Interview Scheduled!",
        message=f"An interview has been scheduled for '{app.job.title}' on {date_str}.",
        type="interview",
        link=f"/candidate/dashboard"
    )

    # Send Email
    EmailService.send_interview_invite(
        candidate_name=app.candidate.full_name,
        job_title=app.job.title,
        date_str=date_str,
        meeting_link=app.meeting_link,
        to_email=app.candidate.email
    )
    
    return app


# ─── Bookmarks ────────────────────────────────────────────────────────────────

def toggle_bookmark(db: Session, job_id: int, user: User) -> dict:
    existing = db.query(Bookmark).filter_by(user_id=user.id, job_id=job_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"bookmarked": False}
    else:
        bm = Bookmark(user_id=user.id, job_id=job_id)
        db.add(bm)
        db.commit()
        return {"bookmarked": True}


def get_bookmarks(db: Session, user_id: int):
    from app.schemas.schemas import JobOut
    bookmarks = db.query(Bookmark).options(
        joinedload(Bookmark.job).selectinload(Job.skills)
    ).filter(Bookmark.user_id == user_id).order_by(Bookmark.created_at.desc()).all()

    results = []
    for bm in bookmarks:
        if bm.job:
            j = JobOut.model_validate(bm.job)
            j.is_bookmarked = True
            results.append(j)
    return results
