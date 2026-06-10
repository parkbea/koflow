@echo off
setlocal
cd /d "%~dp0"

set "SERVER="
if exist "%~dp0.next\standalone\server.js" set "SERVER=.next\standalone\server.js"
if exist "%~dp0server.js" set "SERVER=server.js"

if "%SERVER%"=="" (
  echo [ERROR] server.js not found.
  echo Run "npm run build:deploy" first, or place this file in the standalone folder.
  pause
  exit /b 1
)

if not exist "%~dp0data" mkdir "%~dp0data"
if not exist "%~dp0uploads" mkdir "%~dp0uploads"

set "DB_FILE=%~dp0data\koflow.db"
set "DATABASE_URL=file:%DB_FILE:\=/%"
if "%PORT%"=="" set "PORT=3000"

echo ============================================
echo  koFlow starting
echo  DB   : %DATABASE_URL%
echo  PORT : %PORT%
echo  URL  : http://localhost:%PORT%
echo ============================================

node "%SERVER%"

endlocal
pause