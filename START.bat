@echo off
echo =========================================
echo   CampusFix - Starting All Services
echo =========================================

echo.
echo [1/3] Starting Python AI Service (port 5001)...
start "CampusFix AI Service" cmd /k "cd /d C:\Users\HP\Downloads\campusfix\ai_service && python app.py"

timeout /t 2 /nobreak >nul

echo [2/3] Starting Node.js Backend (port 4000)...
start "CampusFix Backend" cmd /k "cd /d C:\Users\HP\Downloads\campusfix\backend && node index.js"

timeout /t 2 /nobreak >nul

echo [3/3] Starting React Frontend (port 3000)...
start "CampusFix Frontend" cmd /k "cd /d C:\Users\HP\Downloads\campusfix\frontend && npm start"

echo.
echo =========================================
echo All services starting! Open your browser:
echo   http://localhost:3000
echo.
echo Demo Accounts:
echo   Student: student@kiet.edu / student123
echo   Staff:   staff@kiet.edu   / staff123
echo   Admin:   admin@kiet.edu   / admin123
echo =========================================
pause
