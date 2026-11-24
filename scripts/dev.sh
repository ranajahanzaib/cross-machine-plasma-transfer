#!/usr/bin/env bash
set -e

API_PORT="${API_PORT:-8000}"
WEB_PORT="${PORT:-3000}"

echo "Starting Cross-Machine Plasma Transfer Analysis..."
echo "Backend: FastAPI (http://localhost:${API_PORT})"
echo "Frontend: Next.js (http://localhost:${WEB_PORT})"

cleanup() {
    echo "Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Start FastAPI backend
PYTHONPATH=. .venv/bin/uvicorn services.api.plasma_api.main:app --port "$API_PORT" &
BACKEND_PID=$!

# Start Next.js frontend
PORT="$WEB_PORT" API_PORT="$API_PORT" pnpm --filter @plasma/web dev -p "$WEB_PORT" &
FRONTEND_PID=$!

wait
