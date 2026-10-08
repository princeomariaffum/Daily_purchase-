import sys
import subprocess
import os

# 1. Install all dependencies directly using the virtualenv's python pip
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

# 2. Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

# 3. Run database migrations
from django.core.management import call_command
print("Running database migrations...")
call_command('migrate', interactive=False)
print("Migrations completed successfully!")

# 4. Create admin superuser
from django.contrib.auth.models import User
username = 'admin'
email = 'admin@cyhoracorelab.com'
password = 'Admin@2026!'

user, created = User.objects.get_or_create(username=username, defaults={'email': email})
user.set_password(password)
user.is_superuser = True
user.is_staff = True
user.is_active = True
user.save()

if created:
    print(f"SUCCESS: Created new superuser '{username}' with password '{password}'!")
else:
    print(f"SUCCESS: Updated superuser '{username}' password to '{password}'!")
