import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

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
    print(f"SUCCESS: Superuser '{username}' created with password '{password}'!")
else:
    print(f"SUCCESS: Password for superuser '{username}' updated to '{password}'!")
