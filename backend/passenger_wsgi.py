import os
import sys

# Add your project directory to the sys.path
sys.path.insert(0, os.path.dirname(__file__))

# Set environment variable to tell django where your settings module is
os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings'

# Import the django wsgi application
from core.wsgi import application
