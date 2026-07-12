import os
import re

router_dir = "c:/Users/Chandru P/OneDrive/Documents/odoo/backend/app/routers"
for f in os.listdir(router_dir):
    if f.endswith(".py") and f != "__init__.py":
        print(f"=== {f} ===")
        with open(os.path.join(router_dir, f), "r") as file:
            content = file.read()
        routes = re.findall(r"@router\.[a-z]+\([^)]+\)", content)
        for r in routes:
            print("  " + r.strip().replace("\n", " "))
