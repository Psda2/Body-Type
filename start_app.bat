@echo off
echo Starting Backend Server...
start "Backend Server" cmd /k "py -3.12 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload"

echo Starting Mobile App...
start "Mobile App" cmd /k "cd mobile-app-new && npx expo start"

echo Both services started in separate windows.
pause
