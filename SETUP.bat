@echo off
echo.
echo ========================================
echo Collaborative Whiteboard - Setup
echo ========================================
echo.

REM Check Node.js
echo Checking Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js not found. Please install Node.js 16+ from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo Found: %NODE_VERSION%

REM Install Backend Dependencies
echo.
echo [1/2] Installing Backend Dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Error installing backend dependencies
    pause
    exit /b 1
)
cd ..

REM Install Frontend Dependencies
echo.
echo [2/2] Installing Frontend Dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo Error installing frontend dependencies
    pause
    exit /b 1
)
cd ..

REM Setup complete
echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Make sure MongoDB is running (mongod)
echo 2. Run: START.bat
echo    OR manually run:
echo    - Backend: cd backend && npm run dev
echo    - Frontend: cd frontend && npm run dev
echo 3. Open http://localhost:5173 in browser
echo.
pause
