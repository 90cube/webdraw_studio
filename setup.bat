@echo off
setlocal

echo ==================================
echo  WebDraw Studio Project Setup
echo ==================================
echo.

REM --- 1. Create Python Virtual Environment ---
echo [1/2] Checking for Python virtual environment...
if not exist .venv (
    echo    Virtual environment not found. Creating .venv...
    python -m venv .venv
    if %errorlevel% neq 0 (
        echo ERROR: Failed to create virtual environment. Make sure Python is installed and in your PATH.
        pause
        exit /b
    )
    echo    Virtual environment created successfully.
) else (
    echo    Virtual environment already exists.
)
echo.

REM --- 2. Create Model Directory Structure ---
echo [2/2] Creating model directory structure...

set "model_types=checkpoints vae lora controlnet"
set "base_models=sd15 sdxl"

for %%t in (%model_types%) do (
    for %%b in (%base_models%) do (
        if not exist "models\%%t\%%b" (
            mkdir "models\%%t\%%b"
            echo    Created: models\%%t\%%b
        )
    )
)
echo    Model directories created.
echo.

echo ==================================
echo  Setup Complete!
echo ==================================
echo To activate the environment, run: .\.venv\Scripts\activate

pause
