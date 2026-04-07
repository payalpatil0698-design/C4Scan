from app import app
from models import db, User
import os

def reset_db():
    with app.app_context():
        # Drop all tables and recreate them
        db.drop_all()
        db.create_all()
        print("Database tables recreated successfully.")

        # Seed initial data
        # Admin Doctor
        doctor = User(username='doctor_alpha', email='doctor@oncoai.com', role='doctor')
        doctor.set_password('admin123')
        
        # Test Patient
        patient = User(username='patient_zero', email='patient@test.com', role='patient')
        patient.set_password('patient123')
        
        db.session.add(doctor)
        db.session.add(patient)
        db.session.commit()
        print("Initial users seeded successfully.")

if __name__ == '__main__':
    # Ensure we are in the backend directory context if needed
    # but since app.py is here, it should work.
    reset_db()
