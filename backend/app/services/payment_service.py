import stripe
from app.core.config import settings
from app.models.models import RecruiterProfile
from sqlalchemy.orm import Session

stripe.api_key = settings.STRIPE_SECRET_KEY

class PaymentService:
    @staticmethod
    def create_checkout_session(db: Session, recruiter_profile: RecruiterProfile, plan_name: str, price_id: str):
        if not settings.STRIPE_SECRET_KEY:
            # Fallback for dev mode
            return {"url": f"{settings.FRONTEND_URL}/recruiter/dashboard?success=true"}

        try:
            # Create or get customer
            if not recruiter_profile.stripe_customer_id:
                customer = stripe.Customer.create(
                    email=recruiter_profile.user.email,
                    name=recruiter_profile.company_name,
                    metadata={"user_id": recruiter_profile.user_id}
                )
                recruiter_profile.stripe_customer_id = customer.id
                db.commit()
            
            checkout_session = stripe.checkout.Session.create(
                customer=recruiter_profile.stripe_customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=f"{settings.FRONTEND_URL}/recruiter/dashboard?success=true&session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{settings.FRONTEND_URL}/pricing?canceled=true",
                metadata={
                    "user_id": recruiter_profile.user_id,
                    "plan_name": plan_name
                }
            )
            return {"url": checkout_session.url}
        except Exception as e:
            print(f"Stripe Error: {e}")
            raise Exception("Failed to create checkout session")

    @staticmethod
    def handle_webhook(db: Session, payload: str, sig_header: str):
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except Exception as e:
            raise Exception("Invalid webhook signature")

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            user_id = session['metadata']['user_id']
            plan_name = session['metadata']['plan_name']
            
            # Update user's plan in DB
            from app.models.models import User, SubscriptionPlan
            user = db.query(User).filter(User.id == user_id).first()
            if user and user.recruiter_profile:
                plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == plan_name).first()
                if plan:
                    user.recruiter_profile.plan_id = plan.id
                    user.recruiter_profile.stripe_subscription_id = session.get('subscription')
                    db.commit()
        
        return True
