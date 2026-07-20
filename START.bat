@echo off
echo.
echo ========================================
echo Collaborative Whiteboard - Startup
echo ========================================
echo.

REM Check if running from correct directory
if not exist "backend" (
    echo Error: Please run this script from the project root directory
    echo Expected: CollaborativeWhiteboard-/
    pause
    exit /b 1
)

REM Start MongoDB if available
echo.
echo [1/3] Checking MongoDB...
set BACKEND_COMMAND=npm run dev
where mongod >nul 2>nul
if %errorlevel% equ 0 (
    echo MongoDB found. Starting in background...
    start mongod
    timeout /t 2 /nobreak
) else (
    echo MongoDB not found in PATH
    echo Starting backend with temporary in-memory MongoDB
    set BACKEND_COMMAND=npm run dev:memory
)

REM Start Backend
echo.
echo [2/3] Starting Backend on http://localhost:5000...
start cmd /k "cd backend && %BACKEND_COMMAND%"
timeout /t 3 /nobreak

REM Start Frontend
echo.
echo [3/3] Starting Frontend on http://localhost:5173...
start cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Whiteboard is starting!
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Backend: http://localhost:5000
echo.
echo Press Ctrl+C in any terminal to stop
echo.
pause
