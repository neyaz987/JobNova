from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_user, get_current_recruiter, get_optional_user
from app.models.models import User
from app.schemas.schemas import JobCreate, JobUpdate, JobOut, JobListOut, ReportCreate
from app.services.job_service import (
    create_job, update_job, delete_job, get_jobs, get_job_by_id, get_recruiter_jobs,
    get_recommended_jobs, get_similar_jobs
)
from app.services.application_service import toggle_bookmark, get_bookmarks

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.get("/sitemap.xml")
def get_sitemap(db: Session = Depends(get_db)):

    from app.models.models import Job
    jobs = db.query(Job).filter(Job.is_active == True, Job.is_approved == True).all()
    
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    

    xml += '  <url><loc>https://jobnova.com/</loc><priority>1.0</priority></url>\n'
    xml += '  <url><loc>https://jobnova.com/jobs</loc><priority>0.8</priority></url>\n'
    

    for job in jobs:
        xml += f'  <url><loc>https://jobnova.com/jobs/{job.id}</loc><lastmod>{job.updated_at.date()}</lastmod></url>\n'
        
    xml += '</urlset>'
    from fastapi.responses import Response
    return Response(content=xml, media_type="application/xml")


@router.get("", response_model=JobListOut)
def list_jobs(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    experience_level: Optional[str] = None,
    salary_min: Optional[int] = None,
    salary_max: Optional[int] = None,
    skills: Optional[List[str]] = Query(None),
    is_remote: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Search and filter jobs. Authentication optional."""
    """Search and filter jobs. Authentication optional."""

    return get_jobs(
        db=db,
        page=page,
        per_page=per_page,
        search=search,
        location=location,
        job_type=job_type,
        experience_level=experience_level,
        salary_min=salary_min,
        salary_max=salary_max,
        skills=skills,
        is_remote=is_remote,
        current_user=current_user,
    )


@router.get("/search", response_model=JobListOut)
def search_jobs(
    q: Optional[str] = None,
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    experience_level: Optional[str] = None,
    salary_min: Optional[int] = None,
    salary_max: Optional[int] = None,
    skills: Optional[List[str]] = Query(None),
    is_remote: Optional[bool] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):

    return get_jobs(
        db=db, page=page, per_page=per_page, search=q,
        location=location, job_type=job_type,
        experience_level=experience_level,
        salary_min=salary_min, salary_max=salary_max,
        skills=skills, is_remote=is_remote,
        current_user=current_user,
    )


@router.get("/recommendations", response_model=List[JobOut])
async def recommended_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return await get_recommended_jobs(db, current_user)


@router.get("/{job_id}/similar", response_model=List[JobOut])
def similar_jobs(
    job_id: int,
    db: Session = Depends(get_db),
):

    return get_similar_jobs(db, job_id)


@router.get("/my-jobs", response_model=List[JobOut])
def my_posted_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):

    jobs = get_recruiter_jobs(db, current_user.id)
    return [JobOut.model_validate(j) for j in jobs]


@router.get("/bookmarks", response_model=List[JobOut])
def list_bookmarks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_bookmarks(db, current_user.id)


@router.get("/{job_id}", response_model=JobOut)
def get_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user = None,
):
    return get_job_by_id(db, job_id, current_user)


@router.post("", response_model=JobOut, status_code=201)
def post_job(
    data: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):
    return create_job(db, data, current_user)


@router.patch("/{job_id}", response_model=JobOut)
def edit_job(
    job_id: int,
    data: JobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):
    return update_job(db, job_id, data, current_user)


@router.delete("/{job_id}", status_code=204)
def remove_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_recruiter),
):
    delete_job(db, job_id, current_user)


@router.post("/{job_id}/bookmark")
def bookmark_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return toggle_bookmark(db, job_id, current_user)


@router.post("/{job_id}/report")
def report_job(
    job_id: int,
    data: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    from app.services.job_service import create_job_report
    return create_job_report(db, job_id, current_user.id, data.reason, data.details)


@router.post("/generate-description")
async def generate_description(
    title: str,
    company: str,
    requirements: Optional[str] = None,
    current_user: User = Depends(get_current_recruiter),
):

    from app.services.ai_service import generate_job_description
    return {"description": await generate_job_description(title, company, requirements)}