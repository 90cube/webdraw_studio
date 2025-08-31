@echo OFF
title Stop WebDraw Studio Servers

echo Stopping processes on port 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    taskkill /PID %%a /F
)

echo Stopping processes on port 8001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8001') do (
    taskkill /PID %%a /F
)

echo All WebDraw Studio servers stopped.
pause
