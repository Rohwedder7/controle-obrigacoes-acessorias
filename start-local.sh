#!/bin/bash

echo "============================================"
echo "  Sistema de Controle de Obrigações"
echo "  Iniciando ambiente de desenvolvimento"
echo "============================================"

echo ""
echo "[1/4] Verificando se o ambiente virtual existe..."
if [ ! -d "backend/.venv" ]; then
    echo "Criando ambiente virtual..."
    cd backend
    python3 -m venv .venv
    cd ..
fi

echo ""
echo "[2/4] Ativando ambiente virtual e instalando dependências do backend..."
cd backend
source .venv/bin/activate
pip install -r requirements.txt

if [ ! -f ".env" ]; then
    echo "Criando arquivo .env..."
    cat > .env << EOF
SECRET_KEY=dev-secret-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
DATABASE_URL=
EOF
fi

echo ""
echo "[3/4] Executando migrações do banco..."
python manage.py migrate

echo ""
echo "[4/4] Iniciando servidores..."
echo "Iniciando backend em background..."
python manage.py runserver &
BACKEND_PID=$!

cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "Instalando dependências do frontend..."
    npm install
fi

if [ ! -f ".env" ]; then
    echo "VITE_API_URL=http://localhost:8000/api" > .env
fi

echo "Iniciando frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "============================================"
echo "  Ambiente iniciado com sucesso!"
echo ""
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "  Admin:    http://localhost:8000/admin"
echo ""
echo "  Pressione Ctrl+C para parar os servidores"
echo "============================================"

# Função para matar os processos ao receber Ctrl+C
trap 'kill $BACKEND_PID $FRONTEND_PID; exit' INT

# Aguarda os processos
wait
