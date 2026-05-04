import sys
import os
from sqlalchemy import create_engine, inspect, text
from app.db.session import engine
from app.models.models import Base

def auto_migrate():
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()

    with engine.begin() as conn:
        for table_name, table in Base.metadata.tables.items():
            if table_name not in existing_tables:
                print(f"Table {table_name} does not exist. Creating...")
                table.create(engine)
                continue
            
            existing_columns = [col['name'] for col in inspector.get_columns(table_name)]
            for column in table.columns:
                if column.name not in existing_columns:
                    col_type = column.type.compile(dialect=engine.dialect)
                    print(f"Adding column {column.name} of type {col_type} to table {table_name}...")
                    
                    # Handle basic defaults
                    default_str = ""
                    if column.default is not None:
                        if hasattr(column.default, 'arg'):
                            arg = column.default.arg
                            if isinstance(arg, bool):
                                default_str = f" DEFAULT {'TRUE' if arg else 'FALSE'}"
                            elif isinstance(arg, int) or isinstance(arg, float):
                                default_str = f" DEFAULT {arg}"
                            elif isinstance(arg, str):
                                default_str = f" DEFAULT '{arg}'"
                            elif isinstance(arg, list) or isinstance(arg, dict):
                                arg_str = str(arg).replace("'", '"')
                                default_str = f" DEFAULT '{arg_str}'::jsonb"
                    
                    nullable_str = "" if column.nullable else "" # SQLite alter table add column cannot have NOT NULL without default, Postgres can but let's be safe
                    
                    try:
                        conn.execute(text(f'ALTER TABLE "{table_name}" ADD COLUMN "{column.name}" {col_type}{default_str}{nullable_str}'))
                    except Exception as e:
                        print(f"Failed to add {column.name} to {table_name}: {e}")

if __name__ == "__main__":
    auto_migrate()
    print("Auto migration complete.")
