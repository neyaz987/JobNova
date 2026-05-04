from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.schemas import UserRegister, UserLogin, Token, TokenRefresh, UserOut
from app.services.auth_service import register_user, login_user, refresh_access_token
from app.core.dependencies import get_current_user
from app.models.models import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


from app.core.limiter import limiter
from fastapi import Request

@router.post("/register", response_model=Token, status_code=201)
@limiter.limit("5/minute")
def register(request: Request, data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user (candidate, recruiter, or admin)."""
    return register_user(db, data)


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
def login(request: Request, data: UserLogin, db: Session = Depends(get_db)):
    """Login and receive JWT tokens."""
    return login_user(db, data)


@router.post("/refresh", response_model=Token)
def refresh(data: TokenRefresh, db: Session = Depends(get_db)):
    """Refresh access token using a valid refresh token."""
    return refresh_access_token(db, data.refresh_token)


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info."""
    return current_user


@router.post("/verify")
def verify_email(code: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Verify email with OTP code."""
    from app.services.auth_service import verify_user_email
    if verify_user_email(db, current_user.id, code):
        return {"message": "Email verified successfully"}
    raise HTTPException(status_code=400, detail="Invalid or expired verification code")


@router.post("/resend-otp")
def resend_otp(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Resend verification OTP."""
    from app.services.auth_service import resend_verification_otp
    resend_verification_otp(db, current_user.id)
    return {"message": "OTP sent successfully"}
