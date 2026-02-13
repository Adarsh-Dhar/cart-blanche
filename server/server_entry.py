import uvicorn
import os
import sys

# 1. Setup Python Path
SERVER_DIR = os.path.dirname(os.path.abspath(__file__))
if SERVER_DIR not in sys.path:
    sys.path.insert(0, SERVER_DIR)

# 2. Verify Import
try:
    from shopping_concierge import agent
    print("\n✅ SUCCESS: Agent imported perfectly!\n")
except Exception as e:
    print("\n❌ FATAL HIDDEN ERROR EXPOSED ❌")
    import traceback
    traceback.print_exc()

# 3. Start ADK
from google.adk.cli.fast_api import get_fast_api_app
app = get_fast_api_app(
    agents_dir=SERVER_DIR,
    allow_origins=["*"],
    web=False
)

# 4. 🚨 FASTAPI ROUTE PRINTER 🚨
print("\n" + "="*60)
print("🚨 REGISTERED FASTAPI ROUTES 🚨")
if not app.routes:
    print("❌ NO ROUTES GENERATED! ADK auto-discovery completely failed.")
else:
    for route in app.routes:
        methods = getattr(route, "methods", "N/A")
        name = getattr(route, "name", "N/A")
        print(f"Path: {route.path} | Name: {name} | Methods: {methods}")
print("="*60 + "\n")

if __name__ == "__main__":
    uvicorn.run("server_entry:app", host="0.0.0.0", port=8000, reload=True)