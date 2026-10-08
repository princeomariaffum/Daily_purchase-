import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import authenticate
from django.contrib.auth.models import User

print("--- DIAGNOSTIC USER CHECK ---")
users = list(User.objects.all())
print(f"Total users in DB: {len(users)}")
for u in users:
    print(f"Username: '{u.username}' | Active: {u.is_active} | Superuser: {u.is_superuser}")

# Force set password for 'admin' and 'admin123'
if User.objects.filter(username='admin').exists():
    u = User.objects.get(username='admin')
    u.set_password('Admin@2026!')
    u.save()
    print("Reset 'admin' password to 'Admin@2026!'")

if User.objects.filter(username='admin123').exists():
    u = User.objects.get(username='admin123')
    u.set_password('admin123')
    u.save()
    print("Reset 'admin123' password to 'admin123'")

# Test authentication
auth_admin = authenticate(username='admin', password='Admin@2026!')
auth_admin123 = authenticate(username='admin123', password='admin123')

print(f"AUTHENTICATE 'admin': {auth_admin}")
print(f"AUTHENTICATE 'admin123': {auth_admin123}")
