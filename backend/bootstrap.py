import sys
import subprocess
import os

packages = [
    "Django",
    "djangorestframework",
    "djangorestframework-simplejwt",
    "django-cors-headers",
    "dj-database-url",
    "whitenoise"
]

print("Installing required Python packages into virtualenv...")
subprocess.check_call([sys.executable, "-m", "pip", "install"] + packages)
print("All packages installed successfully!")

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from django.core.management import call_command
print("Running database migrations...")
call_command('migrate', interactive=False)
print("Migrations completed successfully!")

from django.contrib.auth.models import User

# Set/Reset admin account credentials
def ensure_user(username, password, email):
    user, created = User.objects.get_or_create(username=username, defaults={'email': email})
    user.set_password(password)
    user.is_superuser = True
    user.is_staff = True
    user.is_active = True
    user.save()
    print(f"User '{username}' ready with password '{password}'")

ensure_user('admin', 'Admin@2026!', 'admin@cyhoracorelab.com')
ensure_user('admin123', 'Admin@2026!', 'admin123@cyhoracorelab.com')
