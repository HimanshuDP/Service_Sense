@echo off
echo Starting ServiceSense Platform...

echo Starting Backend API...
start cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --reload --port 8000"

echo Starting Frontend Web App...
start cmd /k "cd frontend && npm run dev"

echo Applications are starting in new windows!
