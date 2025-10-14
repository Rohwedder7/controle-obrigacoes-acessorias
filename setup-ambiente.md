# 🚀 Guia de Setup - Sistema de Controle de Obrigações Acessórias

## 📋 Pré-requisitos

- **Python 3.11+** (recomendado)
- **Node.js 18+** e **npm**
- **Git**
- **Docker** (opcional, para rodar com containers)

## 🏃‍♂️ Setup Rápido (Desenvolvimento Local)

### 1️⃣ Backend (Django)

```bash
# Navegue para o diretório do backend
cd backend

# Crie e ative o ambiente virtual
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate

# Instale as dependências
pip install -r requirements.txt

# Crie o arquivo de configuração
copy .env.example .env  # Windows
cp .env.example .env    # Linux/Mac

# Configure o arquivo .env (abra em um editor e ajuste)
# Mantenha DEBUG=True e DATABASE_URL vazio para usar SQLite

# Execute as migrações do banco
python manage.py migrate

# Crie um superusuário (admin)
python manage.py createsuperuser

# Inicie o servidor
python manage.py runserver
```

A API estará disponível em: **http://localhost:8000**
Admin Django em: **http://localhost:8000/admin**

### 2️⃣ Frontend (React)

```bash
# Em outro terminal, navegue para o frontend
cd frontend

# Instale as dependências
npm install

# Crie arquivo de configuração (opcional)
echo "VITE_API_URL=http://localhost:8000/api" > .env

# Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em: **http://localhost:5173**

## 🐳 Setup com Docker (Recomendado para Produção)

```bash
# Na raiz do projeto
docker-compose up --build

# Para rodar em background
docker-compose up -d --build
```

Serviços disponíveis:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **Banco PostgreSQL**: localhost:5432

## 🔧 Configuração Inicial

### 1. Acesse o Admin Django
- URL: http://localhost:8000/admin
- Use o superusuário criado anteriormente

### 2. Configure Grupos de Usuários (Roles)
No admin Django, crie os seguintes grupos:
- **Admin** - Acesso total
- **Fiscal** - CRUD de dados
- **Visualizador** - Somente leitura

### 3. Cadastre Estados Iniciais
Através do admin ou da API, cadastre os estados:
```json
POST /api/states/
{
  "code": "SP",
  "name": "São Paulo"
}
```

### 4. Cadastre Empresas e Tipos de Obrigação
Use o admin Django ou a interface web para cadastrar:
- Empresas com CNPJ
- Tipos de obrigação (SPED, ICMS, etc.)

## 📱 Como Usar o Sistema

### 1. Faça Login
- Acesse http://localhost:5173
- Use as credenciais do superusuário ou crie novos usuários

### 2. Navegue pelas Funcionalidades
- **Dashboard**: Visão geral e métricas
- **Obrigações**: Cadastro e gestão de obrigações
- **Entregas**: Registro de submissões
- **Relatórios**: Exportação CSV/Excel
- **Importação**: Upload em massa via Excel

### 3. Importação em Massa
- Vá em "Importação"
- Use a planilha modelo com colunas:
  `company, cnpj, state, obligation_type, competence, due_date, delivery_deadline, notes`

## 🔍 Endpoints da API

### Autenticação
- `POST /api/auth/register/` - Criar usuário
- `POST /api/auth/login/` - Login (retorna JWT)
- `POST /api/auth/refresh/` - Renovar token

### CRUD Principal
- `GET|POST /api/states/` - Estados
- `GET|POST /api/companies/` - Empresas
- `GET|POST /api/obligation-types/` - Tipos de obrigação
- `GET|POST /api/obligations/` - Obrigações
- `GET|POST /api/submissions/` - Entregas

### Relatórios
- `GET /api/reports/summary/` - Resumo geral
- `GET /api/reports/export.csv` - Export CSV
- `GET /api/reports/export.xlsx` - Export Excel

### Dashboard
- `GET /api/dashboard/metrics/` - Métricas para gráficos

### Utilitários
- `POST /api/imports/bulk/` - Importação Excel
- `POST /api/alerts/send-reminders/` - Enviar lembretes

## 🔐 Configurações de Segurança

### Para Produção:
1. Altere `SECRET_KEY` no `.env`
2. Configure `DEBUG=False`
3. Defina `ALLOWED_HOSTS` específicos
4. Configure banco PostgreSQL via `DATABASE_URL`
5. Configure email SMTP para lembretes
6. Opcionalmente, configure AWS S3 para arquivos

### Configuração de Email:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=seu-email@gmail.com
EMAIL_HOST_PASSWORD=sua-senha-de-app
```

## 🐛 Solução de Problemas

### Backend não inicia:
- Verifique se o Python 3.11+ está instalado
- Ative o ambiente virtual
- Verifique se todas as dependências foram instaladas

### Frontend não carrega:
- Verifique se o Node.js 18+ está instalado
- Execute `npm install` novamente
- Verifique se a API está rodando em localhost:8000

### Banco de dados:
- Para resetar: delete `db.sqlite3` e execute `python manage.py migrate` novamente
- Para Docker: `docker-compose down -v` e `docker-compose up --build`

### CORS:
- Certifique-se que `CORS_ALLOW_ALL_ORIGINS = True` está no settings.py
- Para produção, configure CORS específico

## 📚 Estrutura do Projeto

```
Controle de Obrigações Acessórias/
├── backend/                 # Django REST API
│   ├── core/               # App principal
│   ├── obrigacoes/         # Configurações Django
│   ├── requirements.txt    # Dependências Python
│   └── manage.py          # CLI Django
├── frontend/               # React App
│   ├── src/               # Código fonte
│   ├── package.json       # Dependências Node
│   └── vite.config.js     # Configuração Vite
├── docker-compose.yml     # Orquestração containers
└── README.md             # Documentação original
```

## 🎯 Próximos Passos

1. **Configure os dados iniciais** (estados, empresas, tipos)
2. **Teste a importação em massa** com uma planilha Excel
3. **Configure lembretes por email** se necessário
4. **Ajuste permissões** criando grupos de usuários
5. **Deploy em produção** (Railway, Render, etc.)

---

💡 **Dica**: Mantenha sempre backup dos dados e configure um ambiente de homologação antes de ir para produção!
