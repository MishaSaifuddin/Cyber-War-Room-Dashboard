@echo off
title CYBER WAR ROOM - DETECTION SYSTEM
echo.
echo  ==========================================
echo   CYBER WAR ROOM - REAL DETECTION SYSTEM
echo  ==========================================
echo.

REM Find Python - prefer the full Python install (has psutil/websockets)
set "PYTHON="
if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" set "PYTHON=%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" if not defined PYTHON set "PYTHON=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
if "%PYTHON%"=="" set "PYTHON=python"

echo Using: %PYTHON%
echo.
echo Starting backend server...
echo Dashboard will open at: http://127.0.0.1:8080/index.html
echo Press Ctrl+C to stop
echo.

"%PYTHON%" "%~dp0backend\main.py"
pause