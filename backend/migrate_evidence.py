import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import engine
from sqlalchemy import text

def add_columns():
    with engine.begin() as conn:
        try:
            print("Adding resolution_image_url...")
            conn.execute(text("ALTER TABLE incidents ADD COLUMN resolution_image_url VARCHAR;"))
        except Exception as e:
            print(f"Skipped resolution_image_url (might exist): {e}")

        try:
            print("Adding resolution_comment...")
            conn.execute(text("ALTER TABLE incidents ADD COLUMN resolution_comment VARCHAR;"))
        except Exception as e:
            print(f"Skipped resolution_comment (might exist): {e}")

    print("Migration finished!")

if __name__ == "__main__":
    add_columns()
