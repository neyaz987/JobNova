import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.models import User, UserRole, SubscriptionPlan
from app.schemas.schemas import UserOut, UserUpdate, CandidateProfileUpdate, CandidateProfileOut, RecruiterProfileUpdate, RecruiterProfileOut, CompanyPublicOut, SubscriptionPlanOut
from app.core.config import settings
from app.services import ai_service

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return db.query(User).order_by(User.created_at.desc()).all()





@router.patch("/me", response_model=UserOut)
def update_profile(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(current_user, k, v)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/me/profile-score")
def get_profile_score(
    current_user: User = Depends(get_current_user),
):

    if current_user.role != UserRole.candidate:
        raise HTTPException(status_code=400, detail="Only candidates have a profile score")
    
    score = ai_service.calculate_profile_score(current_user, current_user.candidate_profile)
    return {"score": score}


@router.post("/me/avatar", response_model=UserOut)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Only JPEG/PNG/WEBP images allowed")

    size = len(await file.read())
    if size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large (max {settings.MAX_FILE_SIZE_MB}MB)")
    
    await file.seek(0)

    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    path = os.path.join(settings.UPLOAD_DIR, "avatars", filename)

    with open(path, "wb") as f:
        f.write(await file.read())

    current_user.avatar_url = f"/uploads/avatars/{filename}"
    db.commit()
    db.refresh(current_user)
    return current_user




@router.get("/me/candidate-profile", response_model=CandidateProfileOut)
def get_candidate_profile(current_user: User = Depends(get_current_user)):
    if not current_user.candidate_profile:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
    return current_user.candidate_profile


@router.patch("/me/candidate-profile", response_model=CandidateProfileOut)
def update_candidate_profile(
    data: CandidateProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.candidate_profile:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
    profile = current_user.candidate_profile
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(profile, k, v)
    db.commit()
    db.refresh(profile)
    return profile


@router.post("/me/resume", response_model=CandidateProfileOut)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ["application/pdf", "application/msword",
                                   "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
        raise HTTPException(status_code=400, detail="Only PDF/DOC/DOCX files allowed")

    size = len(await file.read())
    if size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large (max {settings.MAX_FILE_SIZE_MB}MB)")

    await file.seek(0)
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    path = os.path.join(settings.UPLOAD_DIR, "resumes", filename)

    with open(path, "wb") as f:
        f.write(await file.read())

    profile = current_user.candidate_profile
    profile.resume_url = f"/uploads/resumes/{filename}"
    profile.resume_filename = file.filename
    db.commit()
    

    if settings.GEMINI_API_KEY:
        try:
            parsed_data = await ai_service.parse_resume_with_ai(path)
            if parsed_data:
                await ai_service.sync_parsed_data_to_profile(db, current_user, parsed_data)
        except Exception as e:
            print(f"Failed to parse resume: {e}")

    db.refresh(profile)
    return profile


@router.get("/me/resume-suggestions", response_model=list[str])
async def get_resume_suggestions(
    current_user: User = Depends(get_current_user),
):

    return await ai_service.get_resume_improvement_suggestions(current_user)




@router.get("/me/recruiter-profile", response_model=RecruiterProfileOut)
def get_recruiter_profile(current_user: User = Depends(get_current_user)):
    if not current_user.recruiter_profile:
        raise HTTPException(status_code=404, detail="Recruiter profile not found")
    return current_user.recruiter_profile


@router.patch("/me/recruiter-profile", response_model=RecruiterProfileOut)
def update_recruiter_profile(
    data: RecruiterProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.recruiter_profile:
        raise HTTPException(status_code=404, detail="Recruiter profile not found")
    profile = current_user.recruiter_profile
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(profile, k, v)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/companies/{recruiter_id}", response_model=CompanyPublicOut)
def get_company_profile(
    recruiter_id: int,
    db: Session = Depends(get_db),
):

    recruiter = db.query(User).filter(User.id == recruiter_id, User.role == UserRole.recruiter).first()
    if not recruiter or not recruiter.recruiter_profile:
        raise HTTPException(status_code=404, detail="Company not found")
    

    from app.models.models import Job
    jobs = db.query(Job).filter(Job.recruiter_id == recruiter_id, Job.is_active == True).all()
    
    return {
        "profile": recruiter.recruiter_profile,
        "jobs": jobs,
        "recruiter_name": recruiter.full_name
    }


@router.get("/subscription-plans", response_model=list[SubscriptionPlanOut])
def list_plans(db: Session = Depends(get_db)):
    return db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()


@router.post("/me/subscribe", response_model=RecruiterProfileOut)
def subscribe_to_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if current_user.role != UserRole.recruiter:
        raise HTTPException(status_code=400, detail="Only recruiters can subscribe to plans")
    
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    from datetime import datetime, timedelta
    
    profile = current_user.recruiter_profile
    profile.plan_id = plan_id
    profile.subscription_expires_at = datetime.utcnow() + timedelta(days=30)
    db.commit()
    db.refresh(profile)
    return profile

@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
