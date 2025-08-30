@echo OFF
title WebDraw Studio Servers

echo Starting Frontend and Backend servers...

REM 1. Start the Frontend server (http.server) in the background on port 8000
echo Starting Frontend server in the background...
start "Frontend Server" /B python -m http.server 8000

REM Give the frontend a moment to start
timeout /t 2 /nobreak > nul

echo Frontend server is running at http://localhost:8000

REM 2. Start the Backend server (uvicorn) in the foreground on port 8001
echo Starting Backend server...
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8001
