import sys
import os
from sqlalchemy import text

# Add the backend directory to sys.path to allow imports from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import engine

def add_column(conn, table, column, type_str):
    try:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {type_str}"))
        conn.commit()
        print(f"Added {column} to {table}")
    except Exception as e:
        conn.rollback()
        if "already exists" in str(e):
            print(f"Column {column} already exists in {table}, skipping.")
        else:
            print(f"Error adding {column} to {table}: {e}")

def migrate():
    with engine.connect() as conn:
        print("Checking for missing columns...")
        
        # --- USERS TABLE ---
        add_column(conn, "users", "oauth_provider", "VARCHAR(50)")
        add_column(conn, "users", "oauth_id", "VARCHAR(255)")
        add_column(conn, "users", "referral_code", "VARCHAR(20) UNIQUE")
        add_column(conn, "users", "referral_count", "INTEGER DEFAULT 0")

        # --- RECRUITER PROFILES TABLE ---
        add_column(conn, "recruiter_profiles", "plan_id", "INTEGER REFERENCES subscription_plans(id)")
        add_column(conn, "recruiter_profiles", "social_links", "JSON DEFAULT '{}'")

        # --- JOBS TABLE ---
        add_column(conn, "jobs", "is_featured", "BOOLEAN DEFAULT FALSE")
        add_column(conn, "jobs", "is_approved", "BOOLEAN DEFAULT TRUE")
        add_column(conn, "jobs", "rejection_reason", "VARCHAR(500)")
        add_column(conn, "jobs", "views_count", "INTEGER DEFAULT 0")
        add_column(conn, "jobs", "applications_count", "INTEGER DEFAULT 0")

        # --- APPLICATIONS TABLE ---
        add_column(conn, "applications", "interview_at", "TIMESTAMP")
        add_column(conn, "applications", "meeting_link", "VARCHAR(500)")
        add_column(conn, "applications", "interview_location", "VARCHAR(255)")
        add_column(conn, "applications", "match_score", "INTEGER")
        add_column(conn, "applications", "match_reasoning", "TEXT")
        add_column(conn, "applications", "interview_date", "TIMESTAMP")
        add_column(conn, "applications", "interview_notes", "TEXT")

        print("Migration complete!")

if __name__ == "__main__":
    migrate()
