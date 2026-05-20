@echo off
title Antigravity Gamified LMS Platform Startup
echo ==========================================================
echo          ANTIGRAVITY GAMIFIED LMS - LAUNCHER UTILITY
echo ==========================================================
echo.
echo [*] Bypassing execution policy and launching start.ps1...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"
pause
