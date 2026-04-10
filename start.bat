@echo off
title Ling Hua - Starting...
echo.
echo  ========================================
echo   Ling Hua - Learn Mandarin Platform
echo  ========================================
echo.

:: Check Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Install from https://python.org
    pause
    exit /b 1
)

:: Check Node
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

:: Install backend dependencies if needed
if not exist "backend\__installed__" (
    echo [1/3] Installing backend dependencies...
    pip install -r backend\requirements.txt >nul 2>&1
    echo. > backend\__installed__
    echo       Done.
) else (
    echo [1/3] Backend dependencies already installed.
)

:: Install frontend dependencies if needed
if not exist "node_modules" (
    echo [2/3] Installing frontend dependencies...
    call npm install >nul 2>&1
    echo       Done.
) else (
    echo [2/3] Frontend dependencies already installed.
)

echo [3/3] Starting servers...
echo.

:: Start backend in a new window
start "Ling Hua Backend (port 5000)" cmd /k "cd /d %~dp0backend && python app.py"

:: Wait a moment for backend to start
timeout /t 2 /nobreak >nul

:: Start frontend in a new window
start "Ling Hua Frontend (port 8080)" cmd /k "cd /d %~dp0 && npm run dev"

:: Wait for frontend to start
timeout /t 4 /nobreak >nul

:: Open browser
echo Opening http://localhost:8080 ...
start http://localhost:8080

echo.
echo  ========================================
echo   Ling Hua is running!
echo.
echo   Frontend: http://localhost:8080
echo   Backend:  http://localhost:5000
echo.
echo   Close the server windows to stop.
echo  ========================================
echo.
pause
