import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def fix_db():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Checking for missing columns in recruiter_profiles...")
        
        # Check if subscription_expires_at exists
        check_query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='recruiter_profiles' AND column_name='subscription_expires_at';
        """)
        result = conn.execute(check_query).fetchone()
        
        if not result:
            print("Adding subscription_expires_at column...")
            conn.execute(text("ALTER TABLE recruiter_profiles ADD COLUMN subscription_expires_at TIMESTAMP;"))
            conn.commit()
            print("Column added successfully.")
        else:
            print("Column subscription_expires_at already exists.")

if __name__ == "__main__":
    try:
        fix_db()
    except Exception as e:
        print(f"Error: {e}")
