import os

print("--- READING SERVER STDERR LOG ---")
log_paths = [
    "/home/cyhoraco/api.cyhoracorelab.com/stderr.log",
    "/home/cyhoraco/logs/php.error.log",
]

found = False
for path in log_paths:
    if os.path.exists(path):
        found = True
        size = os.path.getsize(path)
        print(f"\n=== Reading last 40 lines of {path} (size: {size} bytes) ===")
        try:
            with open(path, "r", errors="ignore") as f:
                lines = f.readlines()
                print("".join(lines[-40:]))
        except Exception as err:
            print(f"Error reading file: {err}")

if not found:
    print("No log files found in expected locations.")

print("--- END OF LOG READ ---")
