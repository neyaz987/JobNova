from app.db.session import engine
from sqlalchemy import text

with engine.begin() as conn:
    conn.execute(text("UPDATE candidate_profiles SET portfolio_projects = '[]'::jsonb WHERE portfolio_projects IS NULL"))
    conn.execute(text("UPDATE applications SET proposed_slots = '[]'::jsonb WHERE proposed_slots IS NULL"))
    print("Database defaults updated successfully!")
