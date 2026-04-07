import sys
import os
from datetime import datetime, timedelta

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from app import app
from models import db, User, Case, Appointment

def inject_variety():
    with app.app_context():
        print("Injecting clinical variety...")
        
        patient = User.query.filter_by(email='john@demo.com').first()
        doctor = User.query.filter_by(email='doctor@onco.ai').first()
        
        if not doctor:
            doctor = User(username='Dr. Collins', email='doctor@onco.ai', role='doctor')
            doctor.set_password('doctor123')
            db.session.add(doctor)
        
        # Clear John's old cases if any (optional, keeping for variety)
        # Case.query.filter_by(patient_id=patient.id).delete()
        
        new_cases = [
            Case(
                patient_id=patient.id,
                doctor_id=doctor.id,
                prediction_label='brain_tumor',
                confidence_score=0.985,
                severity='Critical',
                recommendation="EMERGENCY: Immediate neurosurgical consultation and contrast-enhanced MRI required within 24 hours.",
                clinical_notes="Patient presents with consistent intracranial pressure symptoms. Neural activation high in left frontal lobe.",
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
                clinical_notes="Focal irregular mass with architectural distortion detected. Multi-modal fusion confirms high malignancy risk.",
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
                clinical_notes="Spiculated pulmonary nodule (2.4cm) in right upper lobe. Associated lymphadenopathy suspected.",
                status='completed',
                created_at=datetime.utcnow() - timedelta(days=1)
            ),
            Case(
                patient_id=patient.id,
                doctor_id=doctor.id,
                prediction_label='healthy',
                confidence_score=0.998,
                severity='Low',
                recommendation="ROUTINE: No suspicious lesions detected. Continue annual screening protocol.",
                clinical_notes="Anatomical structures appear within normal clinical limits. No neural anomalies detected.",
                status='completed',
                created_at=datetime.utcnow() - timedelta(hours=2)
            )
        ]
        
        for c in new_cases:
            db.session.add(c)
            
        # Add a few appointments
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

        # Update John's profile
        patient.age = 48
        patient.gender = "Male"
        patient.blood_type = "A+"
        patient.medical_history = "Non-smoker. Family history of hypertension. No known drug allergies."

        db.session.commit()
        print("Variety injected successfully!")

if __name__ == "__main__":
    inject_variety()
