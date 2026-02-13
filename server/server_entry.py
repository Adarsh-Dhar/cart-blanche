


import uvicorn

import uvicorn
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from google.adk.cli.fast_api import get_fast_api_app

# 1. Create a base FastAPI app
app = FastAPI()

# 2. Add CORS middleware manually
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Create the ADK App using the agents_dir
adk_app = get_fast_api_app(
    agents_dir=os.path.abspath(os.path.join(os.path.dirname(__file__), "shopping_concierge")),
    allow_origins=["*"],
    web=False
)

# 4. Mount the ADK app to the root path
app.mount("/", adk_app)

if __name__ == "__main__":
    uvicorn.run("server_entry:app", host="0.0.0.0", port=8000, reload=True)
