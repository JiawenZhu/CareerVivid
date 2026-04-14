#!/bin/bash

# Trap SIGINT (Ctrl+C) and terminate all background child processes
trap "kill 0" EXIT

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting VectorLotto Backend (FastAPI)...${NC}"
(
    cd backend || exit
    source .venv/bin/activate
    uvicorn app.main:app --reload --port 8000
) &

echo -e "${BLUE}Starting VectorLotto Frontend (Next.js)...${NC}"
(
    cd frontend || exit
    npm run dev
) &

# Wait for all background jobs to finish
echo "Both services are starting! Press Ctrl+C at any time to shutdown both."
wait
