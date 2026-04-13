import sys
import os

# Add the 'backend' folder to sys.path so that 'from models import ...' works
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

# Import the Flask app object from backend/app.py
from app import app

# Expose it clearly for Vercel's detection
application = app
