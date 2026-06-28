@echo off
REM ============================================================
REM  SwitchGard - Local startup script
REM  Starts the backend (port 5000) and frontend (port 3000)
REM  each in its own terminal window.
REM ============================================================

echo.
echo ====================================================
echo   Starting SwitchGard (local development)
echo ====================================================
echo.

REM --- Backend ---
echo [1/3] Installing backend dependencies (if needed)...
cd /d "%~dp0Server"
if not exist "node_modules" (
    call npm install
)
echo [1/3] Launching backend on http://localhost:5000 ...
start "SwitchGard Backend" cmd /k "cd /d %~dp0Server && node index.js"

REM --- Frontend ---
echo [2/3] Installing frontend dependencies (if needed)...
cd /d "%~dp0client"
if not exist "node_modules" (
    call npm install
)
echo [2/3] Launching frontend on http://localhost:3000 ...
start "SwitchGard Frontend" cmd /k "cd /d %~dp0client && npm start"

echo.
echo [3/3] Done.
echo   Backend : http://localhost:5000
echo   Frontend: http://localhost:3000  (opens in your browser)
echo.
echo NOTE: A local MongoDB must be running (mongodb://127.0.0.1:27017),
echo       or set MONGODB_URI in Server\.env to a MongoDB Atlas string.
echo.
pause
