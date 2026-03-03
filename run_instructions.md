# How to Run the ServiceSense Platform

This guide provides step-by-step instructions to set up and run the full stack of the project on Windows.

## Prerequisites
Before running the project, ensure you have the following installed and running:
1. **Python 3.10+**
2. **Node.js 18+**
3. **MongoDB** (Must be running locally on default port `localhost:27017`)

---

## Step 1: Set Up & Run the Backend

Open a terminal at the project root (`Yukti_Innovation_Challange_New`) and run the following commands sequentially:

```powershell
# 1. Navigate to the backend directory
cd backend

# 2. Copy the example environment variables file (if not done)
copy .env.example .env

# 3. Create a Python virtual environment
python -m venv venv

# 4. Activate the virtual environment
venv\Scripts\Activate.ps1

# 5. Install the required Python dependencies
pip install -r requirements.txt

# 6. Train the Machine Learning model (IMPORTANT: Must be done on first run)
python ml/train.py

# 7. Start the FastAPI backend server
python -m uvicorn main:app --reload --port 8000

```

*(The backend API and Swagger Docs will now be available at `http://localhost:8000`)*

---

## Step 2: Set Up & Run the Frontend

Open a **new, separate terminal** at the project root (`Yukti_Innovation_Challange_New`) and run these commands sequentially:

```powershell
# 1. Navigate to the frontend directory
cd frontend

# 2. Install Node.js dependencies
npm install

# 3. Start the Next.js development server
npm run dev
```

*(The frontend web application will now be available at `http://localhost:3000`)*

---

## Quick Start (Automated Batch Script)
Once you have completed the initial setup (installing requirements and training the ML model), you can easily start both servers simultaneously next time by creating a file named `run.bat` in the project root with the following code, and double-clicking it:

```bat
@echo off
echo Starting ServiceSense Platform...

echo Starting Backend API...
start cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --reload --port 8000"

echo Starting Frontend Web App...
start cmd /k "cd frontend && npm run dev"

echo Applications are starting in new windows!
```
