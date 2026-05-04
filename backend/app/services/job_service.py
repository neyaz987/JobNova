from sqlalchemy import or_, and_, func
from sqlalchemy.orm import Session, joinedload, selectinload
from fastapi import HTTPException
from typing import Optional, List, Any
from app.models.models import Job, Skill, User, Bookmark, Application, ApplicationStatus
from app.schemas.schemas import JobCreate, JobUpdate, JobListOut, JobOut
from app.services import ai_service


def create_job(db: Session, data: JobCreate, recruiter: User) -> Job:

    profile = recruiter.recruiter_profile
    if not profile:
        raise HTTPException(status_code=403, detail="Recruiter profile not found")


    active_jobs_count = db.query(Job).filter(Job.recruiter_id == recruiter.id, Job.is_active == True).count()
    

    job_limit = 3
    if profile.plan:
        job_limit = profile.plan.job_limit
    
    if active_jobs_count >= job_limit:
        raise HTTPException(
            status_code=403, 
            detail=f"Job limit reached for your plan ({job_limit} jobs). Please upgrade to post more."
        )


    company_name = profile.company_name if profile else recruiter.full_name
    company_logo = profile.company_logo_url if profile else None

    job = Job(
        recruiter_id=recruiter.id,
        company_name=company_name,
        company_logo_url=company_logo,
        **data.model_dump(exclude={"skill_ids"}),
    )
    if data.skill_ids:
        skills = db.query(Skill).filter(Skill.id.in_(data.skill_ids)).all()
        job.skills = skills

    db.add(job)
    db.commit()
    db.refresh(job)
    
    from app.services.audit_service import AuditService
    AuditService.log(db, action="job_create", user_id=recruiter.id, details={"job_id": job.id, "title": job.title})
    
    return job


def update_job(db: Session, job_id: int, data: JobUpdate, recruiter: User) -> Job:
    job = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == recruiter.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    update_data = data.model_dump(exclude_unset=True, exclude={"skill_ids"})
    for k, v in update_data.items():
        setattr(job, k, v)

    if data.skill_ids is not None:
        job.skills = db.query(Skill).filter(Skill.id.in_(data.skill_ids)).all()

    db.commit()
    db.refresh(job)
    return job


def delete_job(db: Session, job_id: int, recruiter: User):
    job = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == recruiter.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()


def get_jobs(
    db: Session,
    page: int = 1,
    per_page: int = 20,
    search: Optional[str] = None,
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    experience_level: Optional[str] = None,
    salary_min: Optional[int] = None,
    salary_max: Optional[int] = None,
    skills: Optional[List[str]] = None,
    is_remote: Optional[bool] = None,
    current_user: Optional[User] = None,
) -> JobListOut:
    query = db.query(Job).options(
        selectinload(Job.skills),
        joinedload(Job.recruiter),
    )


    if not (current_user and current_user.role == "admin"):
        query = query.filter(Job.is_approved == True)

    query = query.filter(Job.is_active == True)

    if search:
        query = query.filter(
            or_(
                Job.title.ilike(f"%{search}%"),
                Job.description.ilike(f"%{search}%"),
                Job.company_name.ilike(f"%{search}%"),
            )
        )
    if location:
        query = query.filter(Job.location.ilike(f"%{location}%"))
    if job_type:
        query = query.filter(Job.job_type == job_type)
    if experience_level:
        query = query.filter(Job.experience_level == experience_level)
    if salary_min:
        query = query.filter(Job.salary_max >= salary_min)
    if salary_max:
        query = query.filter(Job.salary_min <= salary_max)
    if is_remote is not None:
        query = query.filter(Job.is_remote == is_remote)
    if skills:
        query = query.join(Job.skills).filter(Skill.name.in_(skills))

    total = query.count()
    jobs = query.order_by(Job.is_featured.desc(), Job.created_at.desc()) \
                .offset((page - 1) * per_page).limit(per_page).all()


    bookmarked_ids = set()
    applied_ids = set()
    if current_user:
        bookmarked_ids = {b.job_id for b in db.query(Bookmark.job_id).filter(Bookmark.user_id == current_user.id).all()}
        applied_ids = {a.job_id for a in db.query(Application.job_id).filter(Application.candidate_id == current_user.id).all()}

    result = []
    for job in jobs:
        job_out = JobOut.model_validate(job)
        job_out.is_bookmarked = job.id in bookmarked_ids
        job_out.has_applied = job.id in applied_ids
        result.append(job_out)

    return JobListOut(
        jobs=result,
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page,
    )


def get_job_by_id(db: Session, job_id: int, current_user: Optional[User] = None) -> JobOut:
    job = db.query(Job).options(joinedload(Job.skills)).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.views_count += 1
    
    if current_user:
        from app.services.network_service import NetworkService
        NetworkService.track_activity(db, user_id=current_user.id, activity_type="job_view", job_id=job_id)
        
    db.commit()

    job_out = JobOut.model_validate(job)
    if current_user:
        job_out.is_bookmarked = db.query(Bookmark).filter_by(user_id=current_user.id, job_id=job_id).first() is not None
        job_out.has_applied = db.query(Application).filter_by(candidate_id=current_user.id, job_id=job_id).first() is not None
    return job_out


def get_recruiter_jobs(db: Session, recruiter_id: int) -> List[Job]:
    return db.query(Job).options(joinedload(Job.skills)) \
             .filter(Job.recruiter_id == recruiter_id) \
             .order_by(Job.created_at.desc()).all()


def get_pending_jobs(db: Session) -> List[Job]:
    return db.query(Job).options(joinedload(Job.skills)) \
             .filter(Job.is_approved == False) \
             .order_by(Job.created_at.asc()).all()


def moderate_job(db: Session, job_id: int, is_approved: bool, rejection_reason: Optional[str] = None) -> Job:
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job.is_approved = is_approved
    job.rejection_reason = rejection_reason
    db.commit()
    db.refresh(job)
    return job


def create_job_report(db: Session, job_id: int, reporter_id: int, reason: str, details: Optional[str] = None) -> Any:
    from app.models.models import Report
    report = Report(
        job_id=job_id,
        reporter_id=reporter_id,
        reason=reason,
        details=details
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


async def get_recommended_jobs(db: Session, user: User) -> List[JobOut]:

    jobs = db.query(Job).options(selectinload(Job.skills)).filter(
        Job.is_active == True,
        Job.is_approved == True
    ).order_by(Job.created_at.desc()).limit(50).all()
    
    recommended_ids = await ai_service.get_job_recommendations(user, jobs)
    

    recommended_jobs = db.query(Job).options(selectinload(Job.skills)).filter(
        Job.id.in_(recommended_ids)
    ).all()
    

    recommended_jobs.sort(key=lambda x: recommended_ids.index(x.id) if x.id in recommended_ids else 999)
    

    bookmarked_ids = {b.job_id for b in db.query(Bookmark.job_id).filter(Bookmark.user_id == user.id).all()}
    applied_ids = {a.job_id for a in db.query(Application.job_id).filter(Application.candidate_id == user.id).all()}

    result = []
    for job in recommended_jobs[:10]:
        job_out = JobOut.model_validate(job)
        job_out.is_bookmarked = job.id in bookmarked_ids
        job_out.has_applied = job.id in applied_ids
        result.append(job_out)
        
    return result


def get_similar_jobs(db: Session, job_id: int) -> List[JobOut]:
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        return []
        

    similar = db.query(Job).options(selectinload(Job.skills)).filter(
        Job.id != job_id,
        Job.is_active == True,
        Job.is_approved == True,
        or_(
            Job.title.ilike(f"%{job.title}%"),
            Job.experience_level == job.experience_level
        )
    ).limit(5).all()
    
    return [JobOut.model_validate(j) for j in similar]
