from app import app, db
from sqlalchemy import text

with app.app_context():
    try:
        with db.engine.connect() as conn:
            # Check if columns already exist to avoid errors
            res = conn.execute(text("PRAGMA table_info(user)")).fetchall()
            cols = [r[1] for r in res]
            
            if 'city' not in cols:
                conn.execute(text("ALTER TABLE user ADD COLUMN city VARCHAR(100)"))
                print("Added 'city' column to User table.")
            
            if 'specialization' not in cols:
                conn.execute(text("ALTER TABLE user ADD COLUMN specialization VARCHAR(100)"))
                print("Added 'specialization' column to User table.")
            
            if 'address' not in cols:
                conn.execute(text("ALTER TABLE user ADD COLUMN address TEXT"))
                print("Added 'address' column to User table.")
                
            conn.commit()
            print("Database schema updated successfully.")
    except Exception as e:
        print(f"Error updating database: {e}")
