import sys
import os
from datetime import datetime, timedelta

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from app import app
from models import db, User, Case, Appointment

def seed():
    with app.app_context():
        print("Cleaning system for clinical reset...")
        # Order matters for foreign keys
        Case.query.delete()
        Appointment.query.delete()
        User.query.delete()
        db.session.commit()
        
        print("Registering Clinical Entities...")
        # 1. Specialist
        doctor = User(username='Dr. Collins', email='doctor@onco.ai', role='doctor')
        doctor.set_password('doctor123')
        db.session.add(doctor)
        
        # 2. Institutional Demo Account
        patient = User(username='John Doe', email='john@demo.com', role='patient')
        patient.set_password('patient123')
        patient.age = 48
        patient.gender = "Male"
        patient.blood_type = "A+"
        patient.medical_history = "Non-smoker. Family history of hypertension. No known drug allergies."
        db.session.add(patient)
        
        db.session.commit() # Get IDs
        
        print(f"Injecting Diagnostic History for {patient.username}...")
        
        new_cases = [
            Case(
                patient_id=patient.id,
                doctor_id=doctor.id,
                prediction_label='brain_tumor',
                confidence_score=0.985,
                severity='Critical',
                recommendation="EMERGENCY: Immediate neurosurgical consultation and contrast-enhanced MRI required.",
                status='completed',
                created_at=datetime.utcnow() - timedelta(days=5)
            ),
            Case(
                patient_id=patient.id,
                doctor_id=doctor.id,
                prediction_label='breast_cancer',
                confidence_score=0.921,
                severity='High',
                recommendation="URGENT: Core needle biopsy and oncology referral within 48 hours.",
                status='completed',
                created_at=datetime.utcnow() - timedelta(days=3)
            ),
            Case(
                patient_id=patient.id,
                doctor_id=doctor.id,
                prediction_label='lung_cancer',
                confidence_score=0.894,
                severity='High',
                recommendation="URGENT: PET-Scan for staging and pulmonology consultation.",
                status='completed',
                created_at=datetime.utcnow() - timedelta(days=1)
            ),
            Case(
                patient_id=patient.id,
                doctor_id=doctor.id,
                prediction_label='healthy',
                confidence_score=0.998,
                severity='Low',
                recommendation="ROUTINE: No suspicious lesions detected. Continue annual screening.",
                status='completed',
                created_at=datetime.utcnow() - timedelta(hours=2)
            )
        ]
        
        for c in new_cases:
            db.session.add(c)
            
        print("Scheduling Specialist Consultations...")
        appointments = [
            Appointment(
                patient_id=patient.id,
                doctor_id=doctor.id,
                appointment_date=datetime.utcnow() + timedelta(days=1, hours=2),
                reason="Follow-up on Brain MRI results and neurological assessment.",
                status='scheduled'
            ),
            Appointment(
                patient_id=patient.id,
                doctor_id=doctor.id,
                appointment_date=datetime.utcnow() + timedelta(days=3),
                reason="Oncology board review for breast findings.",
                status='scheduled'
            )
        ]
        for a in appointments:
            db.session.add(a)

        db.session.commit()
        print("--- CLINICAL RESET COMPLETE ---")
        print("Demo Patient: john@demo.com / patient123")
        print("Specialist: doctor@onco.ai / doctor123")

if __name__ == "__main__":
    seed()
