# CancerScan AI - Setup Instructions

## Prerequisites
- Python 3.8+
- Node.js & npm
- Tesseract OCR (Optional, for report text extraction)

## Backend Setup
1. Navigate to `backend/`
2. Install dependencies: `pip install -r ../requirements.txt`
3. Generate synthetic data: `python ../scripts/generate_data.py`
4. Train model: `python ../scripts/train_model.py`
5. Start server: `python app.py`

## Frontend Setup
1. Navigate to `frontend/`
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`

## Access
- Patient Portal: Register as a patient.
- Doctor Portal: Register as a doctor to see all analysis history.
