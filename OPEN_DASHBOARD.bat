@echo off
echo ========================================
echo Opening Order Reconciliation Dashboard
echo ========================================
echo.
echo Starting web server...
echo Dashboard will open at: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server when done
echo ========================================
echo.

cd /d "%~dp0"

REM Try to find Python
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Starting Python web server...
    start http://localhost:8000
    python -m http.server 8000
) else (
    echo Python not found. Opening with file:// protocol...
    echo NOTE: Data may not load properly without a web server.
    echo.
    echo To fix this:
    echo 1. Install Python from https://www.python.org/downloads/
    echo 2. Or deploy to GitHub Pages
    echo.
    start index.html
    pause
)

@REM Made with Bob
