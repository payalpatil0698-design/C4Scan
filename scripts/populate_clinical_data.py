import sys
import os
import cv2
import numpy as np
import tensorflow as tf
from datasets import load_dataset
from medmnist import BreastMNIST, PneumoniaMNIST
from datetime import datetime, timedelta

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from app import app
from models import db, User, Case
from services import PredictionService

predictor = PredictionService()

def populate_real_samples():
    with app.app_context():
        print("Resetting database...")
        db.drop_all()
        db.create_all()
        
        print("Starting clinical data population from Hugging Face and MedMNIST...")
        
        # Ensure uploads exists
        upload_dir = 'uploads'
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)

        # Get the dummy patient or create one
        patient = User.query.filter_by(email='john@demo.com').first()
        if not patient:
            patient = User(username='John Doe', email='john@demo.com', role='patient', age=45, gender='Male', blood_type='O+')
            patient.set_password('patient123')
            db.session.add(patient)
            db.session.commit()

        # Get a doctor
        doctor = User.query.filter_by(role='doctor').first()

        # 1. Brain Tumor MRI Sample
        print("Fetching Brain MRI sample...")
        try:
            brain_ds = load_dataset("AIOmarRehan/Brain_Tumor_MRI_Dataset", split="test", streaming=True)
            for item in brain_ds.take(2):
                img = np.array(item['image'])
                lbl = item['label']
                # 0: glioma, 1: meningioma, 2: notumor, 3: pituitary
                # Map to our labels
                label_name = "brain_tumor" if lbl != 2 else "healthy"
                
                filename = f"sample_brain_{lbl}_{datetime.now().timestamp()}.png"
                filepath = os.path.join(upload_dir, filename)
                cv2.imwrite(filepath, cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
                
                process_and_save_case(patient, doctor, filepath, "Patient shows focal neurological symptoms.")
        except Exception as e:
            print(f"Error brain: {e}")

        # 2. Breast Ultrasound Sample
        print("Fetching BreastMNIST sample...")
        try:
            data = BreastMNIST(split='train', download=True, size=224)
            for i in range(2):
                img = data.imgs[i]
                lbl = data.labels[i][0]
                # 0: malignant, 1: normal
                label_name = "breast_cancer" if lbl == 0 else "healthy"
                
                filename = f"sample_breast_{lbl}_{datetime.now().timestamp()}.png"
                filepath = os.path.join(upload_dir, filename)
                cv2.imwrite(filepath, img) # BreastMNIST is grayscale, cv2 handles it
                
                process_and_save_case(patient, doctor, filepath, "Self-examination revealed palpable lump.")
        except Exception as e:
            print(f"Error breast: {e}")

        # 3. Lung X-Ray Sample
        print("Fetching PneumoniaMNIST sample...")
        try:
            data = PneumoniaMNIST(split='train', download=True, size=224)
            for i in range(2):
                img = data.imgs[i]
                lbl = data.labels[i][0]
                # 0: normal, 1: pneumonia
                label_name = "lung_cancer" if lbl == 1 else "healthy"
                
                filename = f"sample_lung_{lbl}_{datetime.now().timestamp()}.png"
                filepath = os.path.join(upload_dir, filename)
                cv2.imwrite(filepath, img)
                
                process_and_save_case(patient, doctor, filepath, "Persistent cough and shortness of breath.")
        except Exception as e:
            print(f"Error lung: {e}")

        db.session.commit()
        print("Clinical data population complete!")

def process_and_save_case(patient, doctor, filepath, notes):
    # Use predictor to get real AI result
    label, conf, heatmap, severity, recommendation = predictor.predict_scan(filepath)
    
    new_case = Case(
        patient_id=patient.id,
        doctor_id=doctor.id if doctor else None,
        scan_path=filepath,
        heatmap_path=heatmap,
        prediction_label=label,
        confidence_score=conf,
        severity=severity,
        recommendation=recommendation,
        clinical_notes=notes,
        status='completed',
        created_at=datetime.utcnow() - timedelta(days=np.random.randint(1, 10))
    )
    db.session.add(new_case)
    print(f"Added Case: {label} (Severity: {severity})")

if __name__ == "__main__":
    populate_real_samples()
