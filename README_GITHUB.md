# 🎯 Sistema de Controle de Obrigações Acessórias

[![Django](https://img.shields.io/badge/Django-5.0-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Sistema completo de gerenciamento de obrigações acessórias fiscais com notificações automáticas, fluxo de aprovação e relatórios avançados.

---

## 🚀 Tecnologias

### Backend
- **Django 5.0** + **Django REST Framework**
- **JWT Authentication** (SimpleJWT)
- **PostgreSQL** (produção) / **SQLite** (desenvolvimento)
- **CORS** habilitado
- **Openpyxl** para importação/exportação Excel
- **S3/Boto3** para armazenamento de arquivos (opcional)

### Frontend
- **React 18** com **Vite**
- **Tailwind CSS** para estilização
- **React Router** para navegação
- **Chart.js** para gráficos
- **Lucide Icons**

---

## 📦 Instalação Rápida

### Pré-requisitos
- Python 3.10+
- Node.js 18+
- Git

### 1. Clone o repositório
```bash
git clone https://github.com/SEU_USUARIO/obrigacoes-acessorias.git
cd obrigacoes-acessorias
```

### 2. Backend (Django)
```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env

# Configure SECRET_KEY no .env
python manage.py migrate
python manage.py create_user_roles
python manage.py createsuperuser
python manage.py runserver
```

Backend rodando em: `http://localhost:8000`

### 3. Frontend (React)
```bash
cd frontend
npm install
cp .env.example .env

# Configurar VITE_API_URL se necessário
npm run dev
```

Frontend rodando em: `http://localhost:5173`

---

## 🐳 Docker (Alternativa)

```bash
docker-compose up --build
```

Acesse:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Admin: `http://localhost:8000/admin`

---

## ✨ Funcionalidades

### 👤 Gestão de Usuários
- [x] **2 níveis de acesso:** Admin e Usuário
- [x] **Criação de usuários** via interface (Admin apenas)
- [x] **Gerador de senhas** automático
- [x] **Histórico de ações** (AuditLog)
- [x] **Proteção:** não permite excluir o último Admin

### 📋 Obrigações
- [x] **CRUD completo** de empresas, estados e tipos de obrigação
- [x] **Recorrências automáticas** (mensal, bimestral, trimestral, etc)
- [x] **Planejamento antecipado** de obrigações futuras
- [x] **Importação em massa** via Excel
- [x] **Exportação** CSV/XLSX com filtros avançados

### 📨 Entregas
- [x] **Upload de comprovantes** (múltiplos arquivos)
- [x] **Tipos de entrega:** Original e Retificadora
- [x] **Fluxo de aprovação** completo
- [x] **Status:** Pendente / Aprovado / Recusado / Necessita Revisão

### 🔔 Notificações
- [x] **5 tipos de notificação:**
  - ⚠️ Vencimento próximo (≤3 dias)
  - 🔴 Obrigações em atraso
  - ✅ Entrega aprovada
  - ❌ Entrega recusada
  - ⚠️ Revisão solicitada
- [x] **Sininho no Header** com badge de não lidas
- [x] **Polling automático** a cada 60s
- [x] **Página dedicada** com filtros avançados
- [x] **Deduplicação** (evita spam diário)

### 📊 Relatórios
- [x] **Dashboard** com gráficos (Chart.js)
- [x] **Métricas:** compliance rate, atrasos, próximos vencimentos
- [x] **Filtros avançados:** empresa, estado, tipo, competência, período
- [x] **Exportação:** CSV, Excel (XLSX)
- [x] **Relatórios por usuário** responsável

### 🔐 Segurança
- [x] **Autenticação JWT**
- [x] **Permissões granulares** (IsAdmin, IsApprover, etc)
- [x] **Prevenção IDOR** (ownership validation)
- [x] **Transações atômicas**
- [x] **AuditLog** completo
- [x] **Validações robustas**

---

## 📚 Documentação Detalhada

### Criar primeiro usuário Admin:
```bash
cd backend
python manage.py createsuperuser
```

### Gerar notificações automáticas (cron):
```bash
# Executar diariamente às 8h
python manage.py make_notifications --days-ahead 3
```

### Endpoints principais:

**Autenticação:**
- `POST /api/auth/login/` - Login (retorna JWT)
- `POST /api/auth/refresh/` - Refresh token
- `GET /api/me/` - Dados do usuário logado

**Admin - Gestão de Usuários:**
- `POST /api/users/create/` - Criar usuário (Admin apenas)
- `GET /api/users/admin/` - Listar usuários
- `PATCH /api/users/{id}/role/` - Alterar papel
- `DELETE /api/users/{id}/` - Excluir usuário

**Obrigações:**
- `GET /api/obligations/` - Listar obrigações
- `POST /api/obligations/` - Criar obrigação
- `POST /api/imports/obligations/` - Importação em massa

**Entregas:**
- `POST /api/submissions/` - Enviar entrega
- `GET /api/approvals/pending/` - Pendentes de aprovação
- `POST /api/approvals/{id}/approve/` - Aprovar
- `POST /api/approvals/{id}/reject/` - Recusar

**Notificações:**
- `GET /api/notifications/` - Listar notificações
- `POST /api/notifications/{id}/read/` - Marcar como lida
- `POST /api/notifications/read-all/` - Marcar todas

**Relatórios:**
- `GET /api/reports/detailed/` - Relatório detalhado (JSON)
- `GET /api/reports/export.csv` - Exportar CSV
- `GET /api/reports/export.xlsx` - Exportar Excel

---

## ⚙️ Configuração de Produção

### Variáveis de Ambiente (.env)

**Backend essenciais:**
```bash
SECRET_KEY=<gerar-com-django-generate-secret-key>
DEBUG=False
ALLOWED_HOSTS=seudominio.com,api.seudominio.com
DATABASE_URL=postgres://user:pass@host:5432/db
```

**Email (opcional):**
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=seu-email@gmail.com
EMAIL_HOST_PASSWORD=senha-app-google
```

**S3 (opcional):**
```bash
USE_S3=True
AWS_ACCESS_KEY_ID=sua-key
AWS_SECRET_ACCESS_KEY=sua-secret
AWS_STORAGE_BUCKET_NAME=seu-bucket
AWS_S3_REGION_NAME=us-east-1
```

### Deploy Recomendado

- **Backend:** Render, Railway, AWS Elastic Beanstalk
- **Frontend:** Vercel, Netlify, Cloudflare Pages
- **Banco:** ElephantSQL, Supabase, AWS RDS
- **Storage:** AWS S3, Backblaze B2

---

## 🧪 Testes

```bash
# Backend
cd backend
python manage.py test

# Frontend
cd frontend
npm run test
```

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📞 Suporte

Em caso de dúvidas ou problemas:
- Abra uma [Issue](https://github.com/SEU_USUARIO/obrigacoes-acessorias/issues)
- Consulte a documentação em [`IMPLEMENTACAO_COMPLETA.md`](IMPLEMENTACAO_COMPLETA.md)

---

## ⚠️ Avisos de Segurança

🔒 **IMPORTANTE:**
- **Nunca commite** arquivos `.env` com credenciais reais
- **Altere** o `SECRET_KEY` em produção
- **Desabilite** `DEBUG=False` em produção
- **Configure** `ALLOWED_HOSTS` corretamente
- **Use HTTPS** em produção
- **Backup** regular do banco de dados

---

## 🎉 Agradecimentos

Desenvolvido com ❤️ para otimizar a gestão de obrigações fiscais.

---

**Status:** ✅ Produção Ready | **Versão:** 1.0.0 | **Última atualização:** 2025-01

