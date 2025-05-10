@echo off
REM 모든 Node.js 서버 종료
 taskkill /F /IM node.exe
REM 모든 Python 서버 종료
 taskkill /F /IM python.exe
echo 모든 서버 프로세스가 종료되었습니다.
pause 