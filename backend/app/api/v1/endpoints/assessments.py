from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.models import User, Assessment, AssessmentAttempt
from app.services import assessment_service

router = APIRouter(prefix="/assessments", tags=["Assessments"])

@router.get("/skill/{skill_id}")
async def get_assessment(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get or generate an assessment for a specific skill."""
    assessment = await assessment_service.get_or_create_assessment(db, skill_id)
    # We don't return the correct_option_index to the frontend
    questions = []
    for q in assessment.questions:
        questions.append({
            "id": q.id,
            "text": q.text,
            "options": q.options
        })
    
    return {
        "id": assessment.id,
        "title": assessment.title,
        "duration_minutes": assessment.duration_minutes,
        "questions": questions
    }

@router.post("/{assessment_id}/submit")
async def submit_test(
    assessment_id: int,
    answers: List[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit answers for an assessment."""
    attempt = assessment_service.submit_assessment(db, current_user.id, assessment_id, answers)
    return attempt

@router.get("/my-attempts")
async def get_my_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all assessment attempts for the current user."""
    return assessment_service.get_user_attempts(db, current_user.id)
@router.get("/mock-interview/{job_id}")
async def start_mock_interview(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start an AI-powered mock interview for a specific job."""
    from app.models.models import Job
    from app.services import ai_service
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    questions = await ai_service.generate_mock_interview_questions(job.title, job.description)
    return {"questions": questions}


@router.post("/mock-interview/{job_id}/submit")
async def submit_mock_interview(
    job_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit mock interview answers for AI feedback."""
    from app.models.models import Job
    from app.services import ai_service
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    feedback = await ai_service.get_mock_interview_feedback(
        job.title, 
        data.get("questions", []), 
        data.get("answers", [])
    )
    return feedback
