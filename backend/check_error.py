import sys
import traceback
import os

print("--- DIAGNOSTIC CHECK ---")
print("Python executable:", sys.executable)
print("Python version:", sys.version)
print("Current working dir:", os.getcwd())

try:
    print("1. Testing settings module import...")
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    import django
    django.setup()
    print("   -> Django setup SUCCESS!")

    print("2. Testing WSGI application load...")
    from core.wsgi import application
    print("   -> WSGI application load SUCCESS!")

    print("3. Testing DB query...")
    from django.contrib.auth.models import User
    print(f"   -> DB Query SUCCESS! Total users: {User.objects.count()}")

except Exception as e:
    print("\n=== CRITICAL EXCEPTION CAUGHT ===")
    traceback.print_exc()

print("--- END DIAGNOSTIC ---")
