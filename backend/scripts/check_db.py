import os
import sys
# Add the backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)
from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, ".env"))
from app.db.session import SessionLocal
from app.models.models import SubscriptionPlan

db = SessionLocal()
plans = db.query(SubscriptionPlan).all()
print(f"Found {len(plans)} plans")
for p in plans:
    print(f"- {p.name}: ₹{p.price} (Active: {p.is_active})")
db.close()
