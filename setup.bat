@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo    Body-Type Project Setup Script
echo ==========================================

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python 3.12+.
    pause
    exit /b 1
)

:: Check for Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH. Please install Node.js.
    pause
    exit /b 1
)

:: Step 1: Python Virtual Environment
echo.
echo [1/4] Setting up Python virtual environment...
if not exist ".venv" (
    python -m venv .venv
    echo Created .venv directory.
) else (
    echo .venv already exists.
)

:: Step 2: Install Backend Dependencies
echo.
echo [2/4] Installing backend dependencies...
call .venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Python dependencies.
    pause
    exit /b 1
)

:: Step 3: Install Mobile App Dependencies
echo.
echo [3/4] Installing mobile app dependencies...
cd mobile-app-new
call npm install
if %errorlevel% neq 0 (
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
    echo.
    set /p API_KEY="Enter your OPENAI_API_KEY (or press Enter to skip): "
    if not "!API_KEY!"=="" (
        echo OPENAI_API_KEY=!API_KEY! > .env
    )
    echo .env file created. Please update it with your API keys if you skipped.
) else (
    echo .env file already exists.
)

:: Get Local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do (
    set temp_ip=%%a
    set LOCAL_IP=!temp_ip:~1!
    goto :found_ip
)
:found_ip

echo.
echo ==========================================
echo    Setup Complete!
echo.
echo    IMPORTANT FOR EXPO GO:
echo    1. Your PC Local IP: !LOCAL_IP!
echo    2. Update 'BASE_URL' in:
echo       mobile-app-new\src\services\api.js
echo       to: http://!LOCAL_IP!:8001
echo.
echo    You can now run the app using:
echo    start_app.bat
echo ==========================================
pause
