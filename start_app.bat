@echo off
echo ==========================================
echo    Starting Body-Type Application
echo ==========================================

echo Checking Backend Dependencies...
if not exist ".venv" (
    echo [WARNING] .venv folder missing. Please run setup.bat first.
    goto :no_venv
)

:: Check if venv is broken
".venv\Scripts\python.exe" --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] .venv is broken. Please run setup.bat first.
    goto :no_venv
)

echo Using virtual environment...
call .venv\Scripts\activate
pip install -r requirements.txt
goto :start_services

:no_venv
echo Attempting to start with global Python...
py -3.12 -m pip install -r requirements.txt

:start_services
echo.
echo Starting Backend Server...
start "Backend Server" cmd /k "py -3.12 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload"

echo Starting Mobile App...
start "Mobile App" cmd /k "cd mobile-app-new && npx expo start"

echo.
echo Both services starting. Check the new windows for status.
pause
