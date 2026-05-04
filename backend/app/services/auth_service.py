from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import User, UserRole, CandidateProfile, RecruiterProfile
from app.schemas.schemas import UserRegister, UserLogin, Token
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.services.email_service import EmailService
import random
import string


def register_user(db: Session, data: UserRegister) -> Token:
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        role=data.role,
    )
    db.add(user)
    db.flush()

    if data.role == UserRole.candidate:
        profile = CandidateProfile(user_id=user.id)
        db.add(profile)
    elif data.role == UserRole.recruiter:
        profile = RecruiterProfile(user_id=user.id, company_name=data.company_name or "")
        db.add(profile)

    # Generate OTP
    otp = ''.join(random.choices(string.digits, k=6))
    user.verification_code = otp

    db.commit()
    db.refresh(user)

    # Send OTP Email
    EmailService.send_verification_otp(user.email, otp)

    return _generate_tokens(user)


def login_user(db: Session, data: UserLogin) -> Token:
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    
    # We allow login even if not verified, but frontend will show verification screen
    from app.services.audit_service import AuditService
    AuditService.log(db, action="login", user_id=user.id)
    
    return _generate_tokens(user)


def verify_user_email(db: Session, user_id: int, code: str) -> bool:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.verification_code == code:
        user.is_verified = True
        user.verification_code = None
        db.commit()
        return True
    return False


def resend_verification_otp(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    otp = ''.join(random.choices(string.digits, k=6))
    user.verification_code = otp
    db.commit()
    
    EmailService.send_verification_otp(user.email, otp)
    return True


def refresh_access_token(db: Session, refresh_token: str) -> Token:
    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _generate_tokens(user)


def _generate_tokens(user: User) -> Token:
    from app.schemas.schemas import UserOut
    access = create_access_token({"sub": str(user.id), "role": user.role.value})
    refresh = create_refresh_token({"sub": str(user.id)})
    return Token(
        access_token=access,
        refresh_token=refresh,
        user=UserOut.model_validate(user),
    )
