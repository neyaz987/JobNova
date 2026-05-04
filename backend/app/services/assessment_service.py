from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import List, Dict, Any
from app.models.models import Assessment, Question, AssessmentAttempt, Skill
from app.services import ai_service

async def get_or_create_assessment(db: Session, skill_id: int) -> Assessment:
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    assessment = db.query(Assessment).filter(Assessment.skill_id == skill_id).first()
    if assessment:
        return assessment

    # Create new assessment using AI
    questions_data = await ai_service.generate_assessment_questions(skill.name)
    if not questions_data:
        raise HTTPException(status_code=500, detail="Failed to generate assessment questions")

    assessment = Assessment(
        title=f"{skill.name} Verification Test",
        skill_id=skill_id,
        duration_minutes=10,
        pass_score=70
    )
    db.add(assessment)
    db.flush()

    for q in questions_data:
        question = Question(
            assessment_id=assessment.id,
            text=q["text"],
            options=q["options"],
            correct_option_index=q["correct_option_index"]
        )
        db.add(question)
    
    db.commit()
    db.refresh(assessment)
    return assessment

def submit_assessment(db: Session, user_id: int, assessment_id: int, answers: List[int]) -> AssessmentAttempt:
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    questions = assessment.questions
    if len(answers) != len(questions):
        raise HTTPException(status_code=400, detail="Invalid number of answers")

    correct_count = 0
    for i, answer in enumerate(answers):
        if answer == questions[i].correct_option_index:
            correct_count += 1
    
    score = int((correct_count / len(questions)) * 100)
    is_passed = score >= assessment.pass_score

    attempt = AssessmentAttempt(
        assessment_id=assessment_id,
        user_id=user_id,
        score=score,
        is_passed=is_passed
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt

def get_user_attempts(db: Session, user_id: int):
    return db.query(AssessmentAttempt).filter(AssessmentAttempt.user_id == user_id).all()
