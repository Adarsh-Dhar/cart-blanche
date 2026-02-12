#!/bin/bash


# Kill any process using port 8000 (backend)
BACKEND_PORT=8000
FRONTEND_PORT=3000
echo "Checking for existing process on port $BACKEND_PORT..."
EXISTING_BACKEND_PID=$(lsof -ti tcp:$BACKEND_PORT)
if [ -n "$EXISTING_BACKEND_PID" ]; then
	echo "Killing backend process on port $BACKEND_PORT (PID $EXISTING_BACKEND_PID)"
	kill -9 $EXISTING_BACKEND_PID
fi

# Kill any process using port 3000 (frontend)
echo "Checking for existing process on port $FRONTEND_PORT..."
EXISTING_FRONTEND_PID=$(lsof -ti tcp:$FRONTEND_PORT)
if [ -n "$EXISTING_FRONTEND_PID" ]; then
	echo "Killing frontend process on port $FRONTEND_PORT (PID $EXISTING_FRONTEND_PID)"
	kill -9 $EXISTING_FRONTEND_PID
fi

# Remove Next.js dev lock if present
if [ -f frontend/.next/dev/lock ]; then
	echo "Removing Next.js dev lock file..."
	rm -f frontend/.next/dev/lock
fi

# Load environment variables from .env if present
if [ -f .env ]; then
	set -a
	. ./.env
	set +a
fi
# Start backend (FastAPI/ADK) on port 8000
echo "Starting backend (server_entry.py) on port $BACKEND_PORT..."
uvicorn server.server_entry:app --host 0.0.0.0 --port $BACKEND_PORT --reload &
BACKEND_PID=$!

# Start frontend (Next.js) on port 3000
echo "Starting frontend (Next.js) on port $FRONTEND_PORT..."
cd frontend || exit 1
pnpm dev &
FRONTEND_PID=$!
cd ..

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Both servers are starting. Use 'kill $BACKEND_PID $FRONTEND_PID' to stop them."
