# Serve ADK dev-ui static files for local development
import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Path to the dev-ui assets in the ADK package
ADK_DEV_UI_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    ".venv",
    "lib",
    "python3.12",
    "site-packages",
    "google",
    "adk",
    "cli",
    "browser"
)

# Mount /dev-ui to serve the static files
if os.path.isdir(ADK_DEV_UI_PATH):
    app.mount("/dev-ui", StaticFiles(directory=ADK_DEV_UI_PATH), name="dev-ui")

# Optionally, add a root endpoint for testing
default_message = {"message": "ADK dev-ui static server running."}
@app.get("/")
def root():
    return default_message
