@echo off
echo ==========================================
echo    Body-Type Project Setup Script
echo ==========================================

:: Check for Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python 3.12+.
    pause
    exit /b 1
)

:: Check for Node.js
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH. Please install Node.js.
    pause
    exit /b 1
)

:: Step 1: Python Virtual Environment
echo.
echo [1/4] Setting up Python virtual environment...

if not exist ".venv" goto :create_venv

:: If it exists, check if it's broken
".venv\Scripts\python.exe" --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] .venv is broken. Re-creating...
    rmdir /s /q .venv
    goto :create_venv
)

echo .venv already exists and is working.
goto :install_backend

:create_venv
echo Creating virtual environment using py -3.12...
py -3.12 -m venv .venv
if errorlevel 1 (
    echo [WARNING] py -3.12 failed. Trying default 'python'...
    python -m venv .venv
)

:install_backend
:: Step 2: Install Backend Dependencies
echo.
echo [2/4] Installing backend dependencies...
call .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install Python dependencies.
    pause
    exit /b 1
)

:: Step 3: Install Mobile App Dependencies
echo.
echo [3/4] Installing mobile app dependencies...
cd mobile-app-new
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install Node.js dependencies.
    cd ..
    pause
    exit /b 1
)
cd ..

:: Step 4: Environment Variables
echo.
echo [4/4] Configuring environment variables...
if not exist ".env" (
    echo Creating .env from .env.example...
    copy .env.example .env
    echo Please update the .env file with your OpenAI API key.
) else (
    echo .env file already exists.
)

:: Get Local IP
echo.
echo Detecting Local IP...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do set LOCAL_IP=%%a
:: Trim leading space
set LOCAL_IP=%LOCAL_IP:~1%

echo.
echo ==========================================
echo    Setup Complete!
echo.
echo    IMPORTANT FOR EXPO GO:
echo    1. Your PC Local IP: %LOCAL_IP%
echo    2. Update 'BASE_URL' in:
echo       mobile-app-new\src\services\api.js
echo       to: http://%LOCAL_IP%:8001
echo.
echo    You can now run the app using:
echo    start_app.bat
echo ==========================================
pause
