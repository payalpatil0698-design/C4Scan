import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from app import app
from models import db, User

with app.app_context():
    user = User.query.filter_by(email='john@demo.com').first()
    if user:
        print(f"User found: {user.username}")
        if user.check_password('patient123'):
            print("Password check: SUCCESS")
        else:
            print("Password check: FAILED")
            # Let's reset it just in case
            user.set_password('patient123')
            db.session.commit()
            print("Password reset to 'patient123'")
    else:
        print("User not found!")
