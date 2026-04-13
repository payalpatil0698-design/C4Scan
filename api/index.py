import sys
import os

# Add the 'backend' folder to sys.path so that 'from models import ...' works
# This ensures that imports inside backend/app.py like 'from models import ...'
# and 'from services import ...' continue to work correctly on Vercel.
backend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend')
sys.path.append(backend_dir)

# Import the Flask app from 'backend/app.py'
try:
    from app import app
except ImportError:
    # Fallback if the pathing behaves differently in certain environments
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from backend.app import app

# Vercel's Python runtime will find the 'app' variable by default
