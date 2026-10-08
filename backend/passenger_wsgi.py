import os
import sys

# 1. Add application directory to sys.path
app_dir = os.path.dirname(os.path.abspath(__file__))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

# 2. Dynamically add virtualenv site-packages to sys.path so LiteSpeed Passenger finds Django
venv_base = "/home/cyhoraco/virtualenv/api.cyhoracorelab.com"
if os.path.exists(venv_base):
    for ver in ["3.11", "3.10", "3.13"]:
        sp = os.path.join(venv_base, ver, f"lib/python{ver}/site-packages")
        if os.path.exists(sp) and sp not in sys.path:
            sys.path.insert(0, sp)

# 3. Set Django settings environment variable
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# 4. Import WSGI application for LiteSpeed Passenger
try:
    from core.wsgi import application
except Exception as e:
    import traceback
    print("Passenger WSGI Startup Error:", e, file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    raise e
