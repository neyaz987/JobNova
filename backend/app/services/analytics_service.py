from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import datetime, timedelta
from app.models.models import User, Job, Application, UserRole, ApplicationStatus
from app.schemas.schemas import RecruiterAnalytics, AdminAnalytics


def get_recruiter_analytics(db: Session, recruiter_id: int) -> RecruiterAnalytics:
    jobs = db.query(Job).filter(Job.recruiter_id == recruiter_id).all()
    job_ids = [j.id for j in jobs]

    total_jobs = len(jobs)
    active_jobs = sum(1 for j in jobs if j.is_active)
    total_applications = db.query(Application).filter(Application.job_id.in_(job_ids)).count()

    status_counts = db.query(
        Application.status, func.count(Application.id)
    ).filter(Application.job_id.in_(job_ids)).group_by(Application.status).all()
    applications_by_status = {s.value: c for s, c in status_counts}

    top_jobs = [
        {"id": j.id, "title": j.title, "applications": j.applications_count, "views": j.views_count}
        for j in sorted(jobs, key=lambda x: x.applications_count, reverse=True)[:5]
    ]

    # Applications over last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    daily_apps = db.query(
        cast(Application.applied_at, Date).label("date"),
        func.count(Application.id).label("count")
    ).filter(
        Application.job_id.in_(job_ids),
        Application.applied_at >= thirty_days_ago
    ).group_by(cast(Application.applied_at, Date)).all()

    applications_over_time = [{"date": str(r.date), "count": r.count} for r in daily_apps]

    # Hiring Funnel
    total_views = sum(j.views_count for j in jobs)
    hiring_funnel = {
        "views": total_views,
        "applications": total_applications,
        "shortlisted": applications_by_status.get(ApplicationStatus.shortlisted.value, 0),
        "interviewed": applications_by_status.get(ApplicationStatus.interview.value, 0),
        "hired": applications_by_status.get(ApplicationStatus.offered.value, 0),
    }

    return RecruiterAnalytics(
        total_jobs=total_jobs,
        active_jobs=active_jobs,
        total_applications=total_applications,
        applications_by_status=applications_by_status,
        top_jobs=top_jobs,
        applications_over_time=applications_over_time,
        hiring_funnel=hiring_funnel,
    )


def get_admin_analytics(db: Session) -> AdminAnalytics:
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0)

    return AdminAnalytics(
        total_users=db.query(User).count(),
        total_candidates=db.query(User).filter(User.role == UserRole.candidate).count(),
        total_recruiters=db.query(User).filter(User.role == UserRole.recruiter).count(),
        total_jobs=db.query(Job).count(),
        total_applications=db.query(Application).count(),
        new_users_this_month=db.query(User).filter(User.created_at >= month_start).count(),
        new_jobs_this_month=db.query(Job).filter(Job.created_at >= month_start).count(),
    )
