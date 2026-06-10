@echo off
setlocal
cd /d "%~dp0"

echo git pull origin HEAD
git pull origin HEAD

echo Done.
endlocal
pause