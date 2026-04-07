import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from app import app
from models import db, User

def fix_auth():
    with app.app_context():
        # Clear existing users or just fix John
        User.query.delete()
        db.session.commit()
        
        # Create Clinical Lead
        admin = User(username='Dr. Collins', email='admin@onco.ai', role='doctor')
        admin.set_password('admin123')
        db.session.add(admin)
        
        # Create Demo Patient
        patient = User(username='John Doe', email='john@demo.com', role='patient')
        patient.set_password('patient123')
        db.session.add(patient)
        
        db.session.commit()
        print("Authentication base reset: [john@demo.com / patient123] and [admin@onco.ai / admin123] ready.")

if __name__ == "__main__":
    fix_auth()
