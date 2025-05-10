@echo off
REM Node.js 서버 실행 (새 창, 최소화)
start /min cmd /c "npm install && npm start"
REM 서버가 뜰 때까지 3초 대기 (필요시 조정)
timeout /t 3 > nul
REM 크롬으로 index.html, admin.html 자동 오픈
start chrome http://localhost:8888/index.html
start chrome http://localhost:8888/admin.html 