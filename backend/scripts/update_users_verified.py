import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import engine
from sqlalchemy import text

def update():
    with engine.connect() as conn:
        # Check is_verified
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE"))
            conn.commit()
            print("Added is_verified")
        except Exception as e:
            conn.rollback()
            print(f"is_verified check: {e}")
            
        # Check verification_code
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN verification_code VARCHAR(10)"))
            conn.commit()
            print("Added verification_code")
        except Exception as e:
            conn.rollback()
            print(f"verification_code check: {e}")

if __name__ == "__main__":
    update()
