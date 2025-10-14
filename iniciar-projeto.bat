@echo off
title Sistema de Obrigacoes Acessorias
echo =============================================
echo   SISTEMA DE CONTROLE DE OBRIGACOES
echo   Iniciando servidores...
echo =============================================

echo.
echo [1] Iniciando Backend Django...
start "BACKEND" cmd /k "cd backend && set DATABASE_URL= && python manage.py runserver 8000"

echo.
echo [2] Aguardando backend inicializar...
timeout /t 5

echo.
echo [3] Iniciando Frontend React...
start "FRONTEND" cmd /k "cd frontend && npm run dev"

echo.
echo =============================================
echo   SERVIDORES INICIADOS!
echo.
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo   Admin:    http://localhost:8000/admin
echo.
echo   Aguarde alguns segundos e acesse:
echo   http://localhost:5173
echo =============================================
echo.
echo Pressione qualquer tecla para abrir o navegador...
pause > nul
start http://localhost:5173

echo.
echo Para parar os servidores, feche as janelas do backend e frontend.
pause
