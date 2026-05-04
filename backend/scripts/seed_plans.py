import sys
import os

# Add the backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

# Load environment variables
from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, ".env"))

from app.db.session import SessionLocal
from app.models.models import SubscriptionPlan

def seed():
    db = SessionLocal()
    try:
        # Refresh plans
        db.query(SubscriptionPlan).delete()

        plans = [
            SubscriptionPlan(
                name="Starter", 
                price=1, 
                job_limit=3, 
                features=["3 Job Posts", "Standard Support", "AI Matching (Limited)"]
            ),
            SubscriptionPlan(
                name="Pro", 
                price=1999, 
                job_limit=15, 
                features=["15 Job Posts", "Featured Listings", "Priority Support", "Full AI Suite"]
            ),
            SubscriptionPlan(
                name="Enterprise", 
                price=9999, 
                job_limit=100, 
                features=["100 Job Posts", "Custom Branding", "Dedicated Account Manager", "Unlimited AI Tools"]
            )
        ]
        
        for p in plans:
            db.add(p)
        
        db.commit()
        print("Subscription plans seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding plans: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
