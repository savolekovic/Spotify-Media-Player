@echo off
echo Starting Spotify Media Player Servers...
echo.

echo Starting Backend Server...
cd backend
start "Backend Server" cmd /k "mvn spring-boot:run"

echo.
echo Waiting 10 seconds for backend to start...
timeout /t 10 /nobreak > nul

echo.
echo Starting Frontend Server...
cd ..\frontend
start "Frontend Server" cmd /k "node server.js"

echo.
echo Both servers are starting...
echo Backend: http://localhost:8080
echo Frontend: https://localhost:3000
echo.
echo Open https://localhost:3000 in your browser
echo Note: You may see a security warning - click "Advanced" and "Proceed to localhost"
pause
