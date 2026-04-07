import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app import app
from models import db, User, Case
from datetime import datetime, timedelta

def seed():
    with app.app_context():
        # Clear existing data
        db.drop_all()
        db.create_all()

        # Create Doctor
        doctor = User(username='Dr. Collins', email='doctor@onco.ai', role='doctor')
        doctor.set_password('doctor123')
        db.session.add(doctor)

        # Create Patient
        patient = User(username='John Doe', email='john@demo.com', role='patient')
        patient.set_password('patient123')
        db.session.add(patient)
        db.session.commit()

        # Add Sample Cases
        cases = [
            Case(
                patient_id=patient.id,
                prediction_label='Brain Tumor',
                confidence_score=0.975,
                status='completed',
                clinical_notes="Significant mass detected in left hemisphere. Immediate oncology referral required.",
                extracted_text="Patient presents with persistent headaches. MRI reveals 4cm mass with irregular borders.",
                created_at=datetime.utcnow() - timedelta(days=2)
            ),
            Case(
                patient_id=patient.id,
                prediction_label='Healthy',
                confidence_score=0.992,
                status='completed',
                clinical_notes="Normal anatomical structures. No evidence of malignancy.",
                extracted_text="Routine annual screening. All biomarkers within normal range.",
                created_at=datetime.utcnow() - timedelta(days=1)
            ),
            Case(
                patient_id=patient.id,
                prediction_label='Lung Cancer',
                confidence_score=0.958,
                status='completed',
                clinical_notes="Patient reports chronic cough and weight loss. CT scan shows suspicious nodule in upper lobe of right lung.",
                extracted_text="CT scan reveals 2.5cm spiculated mass in right upper lobe. Biopsy recommended.",
                created_at=datetime.utcnow() - timedelta(hours=5)
            )
        ]

        for c in cases:
            db.session.add(c)
        
        db.session.commit()
        print("Database pre-populated with Demo Data!")
        print("Doctor Account: doctor@onco.ai / doctor123")
        print("Patient Account: john@demo.com / patient123")

if __name__ == '__main__':
    seed()
