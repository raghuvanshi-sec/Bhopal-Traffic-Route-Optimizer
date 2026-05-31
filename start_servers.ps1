# This script starts both the backend and frontend servers locally in separate windows.
# Make sure to run 'npm install' in the frontend directory first if you haven't already.

echo "Starting Backend API Server..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo "Starting Frontend Dev Server..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

echo "Both servers have been started in new windows!"
