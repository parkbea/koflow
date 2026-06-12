@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo  koFlow standalone builder
echo ============================================

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install Node.js 18+ first.
  pause
  exit /b 1
)

rem 실행 중인 standalone 서버(run.bat)가 .next 파일을 잠가 빌드가 멈추므로 먼저 종료
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -match 'standalone.+server\.js' } | ForEach-Object { Write-Host ('[INFO] stopping running server PID ' + $_.ProcessId); Stop-Process -Id $_.ProcessId -Force }" 2>nul

rem 1) dependencies (only if missing)
if not exist "%~dp0node_modules" (
  echo [1/4] npm install
  call npm install
  if errorlevel 1 goto :fail
) else (
  echo [1/4] node_modules exists - skip install
)

rem 2) prisma client (so generated client matches schema)
echo [2/4] prisma generate
call npx prisma generate
if errorlevel 1 goto :fail

rem 3) database (create + seed only when missing; never overwrites existing data)
if not exist "%~dp0data\koflow.db" (
  echo [3/4] database not found - migrate + seed
  call npx prisma migrate deploy
  if errorlevel 1 goto :fail
  call npm run db:seed
  if errorlevel 1 goto :fail
) else (
  echo [3/4] data\koflow.db exists - skip migrate/seed
)

rem 4) build standalone bundle
echo [4/4] next build + assemble standalone
call npm run build:deploy
if errorlevel 1 goto :fail

echo.
echo ============================================
echo  DONE. Standalone is ready:
echo    .next\standalone
echo.
echo  To deploy: zip the WHOLE .next\standalone folder,
echo  copy to the target PC (Windows x64, Node 18+),
echo  unzip and run run.bat
echo ============================================
endlocal
pause
exit /b 0

:fail
echo.
echo [ERROR] Build failed. See messages above.
endlocal
pause
exit /b 1
