import os
import sys
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from google.adk.cli.fast_api import get_fast_api_app
from google.adk.cli.utils.agent_loader import AgentLoader

# 1. Ensure the server directory is strictly in the Python Path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

print("\n================================================================================")
print("[server_entry.py] Booting up explicit ADK Agent Loader...")

# 2. Force the ADK to load your specific agent directory
loader = AgentLoader(current_dir)
try:
    loader.load_agent("shopping_concierge")
    print("✅ SUCCESS: shopping_concierge explicitly loaded and registered!")
except Exception as e:
    print(f"❌ ERROR loading shopping_concierge: {e}")

print("================================================================================\n")

# 3. Create the FastAPI app (🚨 FIX: Added web=False here 🚨)
app = get_fast_api_app(agents_dir=current_dir, web=False)

# 4. Force extremely permissive CORS so the Next.js frontend is never blocked
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Start the server if this script is run directly
if __name__ == "__main__":
    uvicorn.run("server_entry:app", host="0.0.0.0", port=8000, reload=True)