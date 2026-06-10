@echo off
setlocal
cd /d "%~dp0"

set "MSG=%~1"
if "%MSG%"=="" set "MSG=update"

echo [1/3] git add -A
git add -A
echo [2/3] git commit -m "%MSG%"
git commit -m "%MSG%"
echo [3/3] git push origin HEAD
git push origin HEAD

echo Done.
endlocal
pause