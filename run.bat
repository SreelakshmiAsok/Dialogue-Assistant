@echo off
title Navil - Social Skills Dialogue Assistant
echo ===================================================
echo Starting Dialogue Assistant (Backend & Frontend)...
echo ===================================================

cd /d "%~dp0"

:: Start Flask Backend on port 5001 in a new window
start "Dialogue Assistant Backend (Port 5001)" cmd /k "python backend/app.py"

:: Wait 2 seconds for backend to initialize
timeout /t 2 /nobreak >nul

:: Start Next.js Frontend on port 3000 in a new window
start "Dialogue Assistant Frontend (Port 3000)" cmd /k "npm run dev"

echo.
echo Both services are starting:
echo  - Backend:  http://localhost:5001
echo  - Frontend: http://localhost:3000
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:3000
