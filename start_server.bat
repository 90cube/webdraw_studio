@echo off
title Local Development Server
echo Starting local web server on port 8000...
echo Open your browser and go to http://localhost:8000

REM Check if python is available
python --version >nul 2>nul
if %errorlevel% neq 0 (
    echo Python is not found in your PATH.
    echo Please install Python to run the server.
    pause
    exit /b
)

python -m http.server 8000
