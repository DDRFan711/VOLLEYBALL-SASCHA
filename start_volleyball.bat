@echo off
cd /d "%~dp0"

REM Start Flask visitor counter server
start "Volleyball Flask Server" cmd /k python visitor_counter.py

REM Wait so Flask can start
timeout /t 2 /nobreak >nul

REM Open the website
start http://localhost:8000
