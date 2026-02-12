from fastapi import FastAPI
from google.adk.cli.fast_api import get_fast_api_app
from shopping_concierge.agents import AGENTS

# This helper automatically creates /run, /run_sse, and session routes under /apps/{app_name}/
app: FastAPI = get_fast_api_app(
    agents=AGENTS,
    allow_origins=["http://localhost:3000"]  # Adjust as needed for your frontend
)

@app.get("/health")
async def health():
    return {"status": "ok"}
