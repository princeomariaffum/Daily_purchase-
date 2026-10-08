import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User

print("--- CURRENT USERS IN DB ---")
users = User.objects.all()
print(f"Total users found: {users.count()}")

for u in users:
    print(f" -> Username: '{u.username}' | Active: {u.is_active} | Superuser: {u.is_superuser}")

# Ensure admin account exists with password Admin@2026!
u1, _ = User.objects.get_or_create(username='admin', defaults={'email': 'admin@cyhoracorelab.com'})
u1.set_password('Admin@2026!')
u1.is_superuser = True
u1.is_staff = True
u1.is_active = True
u1.save()
print("SUCCESS: Set password for 'admin' to 'Admin@2026!'")

# Ensure admin123 account exists with password admin123
u2, _ = User.objects.get_or_create(username='admin123', defaults={'email': 'admin123@cyhoracorelab.com'})
u2.set_password('admin123')
u2.is_superuser = True
u2.is_staff = True
u2.is_active = True
u2.save()
print("SUCCESS: Set password for 'admin123' to 'admin123'")
