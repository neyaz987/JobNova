from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.models import User, UserRole, SubscriptionPlan
from app.services.payment_service import PaymentService
from app.core.config import settings

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/create-checkout")
def create_checkout(plan_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.recruiter:
        raise HTTPException(status_code=403, detail="Only recruiters can subscribe to plans")
    
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    if plan.price == 0:
        # Free plan
        current_user.recruiter_profile.plan_id = plan.id
        db.commit()
        return {"url": f"{settings.FRONTEND_URL}/recruiter/dashboard"}

    price_id = settings.STRIPE_PRO_PRICE_ID if plan.name == "Pro" else settings.STRIPE_ENTERPRISE_PRICE_ID
    
    return PaymentService.create_checkout_session(db, current_user.recruiter_profile, plan.name, price_id)

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing stripe-signature")
    
    try:
        PaymentService.handle_webhook(db, payload.decode("utf-8"), sig_header)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
