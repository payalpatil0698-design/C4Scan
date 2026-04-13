import sys
import os

# Add the 'backend' folder to sys.path so that 'from models import ...' works
# This is necessary for imports inside backend/app.py to resolve correctly.
backend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend')
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

# Import the Flask app object directly
from app import app

# Ensure Vercel can find the app object by exposing it clearly as 'app' and 'application'
application = app
