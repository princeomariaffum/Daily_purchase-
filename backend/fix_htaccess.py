import os
import sys
import glob

print("--- PASSENGER .HTACCESS REPAIR ---")

app_root = os.path.dirname(os.path.abspath(__file__))
virtualenv_base = "/home/cyhoraco/virtualenv/api.cyhoracorelab.com"

# Search for virtualenv python binary
python_bins = glob.glob(f"{virtualenv_base}/*/bin/python")
if not python_bins:
    python_bins = glob.glob("/home/cyhoraco/virtualenv/*/*/bin/python")

python_path = python_bins[0] if python_bins else "/home/cyhoraco/virtualenv/api.cyhoracorelab.com/3.11/bin/python"

htaccess_content = f"""# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN
PassengerAppRoot "{app_root}"
PassengerBaseURI "/"
PassengerPython "{python_path}"
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END
"""

htaccess_path = os.path.join(app_root, ".htaccess")
with open(htaccess_path, "w") as f:
    f.write(htaccess_content)

print("SUCCESS! Generated Passenger .htaccess:")
print(htaccess_content)
