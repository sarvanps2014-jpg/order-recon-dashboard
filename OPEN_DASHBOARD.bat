@echo off
echo ========================================
echo Opening Sterling Order Flow Dashboard
echo ========================================
echo.

cd /d "%~dp0"

:: Kill any existing server on port 8000 so a fresh instance starts
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8000 "') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 /nobreak > nul

echo Starting local web server on http://localhost:8000 ...
echo Press Ctrl+C in this window to stop the server.
echo.

start "" "http://localhost:8000/index.html?v=%RANDOM%"
python -m http.server 8000

pause

@REM Made with Bob
