

import uvicorn
import os
from google.adk.cli.fast_api import get_fast_api_app

# Point to the directory containing your 'shopping_concierge' folder
AGENTS_DIR = os.path.dirname(__file__)

# Generate the FastAPI app with ADK routes and CORS automatically enabled
app = get_fast_api_app(
    agents_dir=AGENTS_DIR,
    allow_origins=["*"],
    web=False
)

if __name__ == "__main__":
    # Use the string "server_entry:app" to allow hot-reloading
    uvicorn.run("server_entry:app", host="0.0.0.0", port=8000, reload=True)
