from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    role = db.Column(db.String(20), nullable=False) # 'doctor' or 'patient'
    
    # Medical Profile
    age = db.Column(db.Integer)
    gender = db.Column(db.String(10))
    blood_type = db.Column(db.String(5))
    medical_history = db.Column(db.Text)
    city = db.Column(db.String(100))
    address = db.Column(db.Text)
    specialization = db.Column(db.String(100)) # For doctors
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    appointment_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='scheduled') # 'scheduled', 'completed', 'cancelled'
    reason = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    patient = db.relationship('User', foreign_keys=[patient_id], backref='appointments')
    doctor = db.relationship('User', foreign_keys=[doctor_id], backref='doctor_appointments')

class Case(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    scan_path = db.Column(db.String(255))
    heatmap_path = db.Column(db.String(255))
    report_path = db.Column(db.String(255))
    prediction_label = db.Column(db.String(50))
    confidence_score = db.Column(db.Float)
    extracted_text = db.Column(db.Text)
    clinical_notes = db.Column(db.Text)
    
    # Advanced Diagnostics
    severity = db.Column(db.String(20)) # 'low', 'medium', 'high', 'critical'
    recommendation = db.Column(db.Text)
    
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    patient = db.relationship('User', foreign_keys=[patient_id], backref='cases')
    doctor = db.relationship('User', foreign_keys=[doctor_id], backref='assigned_cases')

class Activity(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    step_count = db.Column(db.Integer, default=0)
    walking_time_minutes = db.Column(db.Integer, default=0)
    activity_level = db.Column(db.String(20), default='low') # 'low', 'moderate', 'high'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    patient = db.relationship('User', foreign_keys=[patient_id], backref='activities')

class SymptomLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    symptom_type = db.Column(db.String(50), nullable=False) # e.g., Pain, Nausea, Fatigue
    severity = db.Column(db.Integer, nullable=False) # 1 to 10
    notes = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    patient = db.relationship('User', foreign_keys=[patient_id], backref='symptom_logs')
