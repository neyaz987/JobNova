from sqlalchemy.orm import Session
from app.models.models import User, UserRole
from fastapi import HTTPException
import uuid

class NetworkService:
    @staticmethod
    def follow_company(db: Session, user_id: int, recruiter_id: int):
        user = db.query(User).filter(User.id == user_id).first()
        recruiter = db.query(User).filter(User.id == recruiter_id, User.role == UserRole.recruiter).first()
        
        if not user or not recruiter:
            raise HTTPException(status_code=404, detail="User or Company not found")
            
        if recruiter in user.following:
            user.following.remove(recruiter)
            db.commit()
            return {"followed": False}
            
        user.following.append(recruiter)
        db.commit()
        return {"followed": True}

    @staticmethod
    def get_referral_code(db: Session, user: User):
        if not user.referral_code:
            user.referral_code = str(uuid.uuid4())[:8].upper()
            db.commit()
        return user.referral_code

    @staticmethod
    def track_activity(db: Session, user_id: int, activity_type: str, job_id: int = None, details: dict = None):
        from app.models.models import UserActivity
        activity = UserActivity(
            user_id=user_id,
            activity_type=activity_type,
            job_id=job_id,
            details=details
        )
        db.add(activity)
        db.commit()
        return activity
