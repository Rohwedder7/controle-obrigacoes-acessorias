# 🚀 COMO RODAR O PROJETO - RESUMO EXECUTIVO

## ⚡ Início Rápido (Windows)

1. **Abra o terminal** na pasta do projeto
2. **Execute**: `start-local.bat`
3. **Aguarde** os servidores iniciarem
4. **Acesse**: http://localhost:5173

## ⚡ Início Rápido (Linux/Mac)

1. **Abra o terminal** na pasta do projeto
2. **Execute**: `./start-local.sh`
3. **Aguarde** os servidores iniciarem
4. **Acesse**: http://localhost:5173

## 🐳 Com Docker (Recomendado)

```bash
docker-compose up --build
```

## 🎯 O que acontece automaticamente:

✅ **Backend Django**
- Cria ambiente virtual Python
- Instala dependências
- Configura banco SQLite
- Executa migrações
- Inicia API em localhost:8000

✅ **Frontend React**
- Instala dependências Node.js
- Configura Vite
- Inicia aplicação em localhost:5173

## 🔑 Primeiro Acesso

1. **Criar superusuário** (apenas primeira vez):
   ```bash
   cd backend
   python manage.py createsuperuser
   ```

2. **Acessar a aplicação**:
   - Frontend: http://localhost:5173
   - Admin: http://localhost:8000/admin

3. **Configurar dados iniciais**:
   - Cadastre estados (SP, RJ, MG, etc.)
   - Cadastre empresas
   - Cadastre tipos de obrigações

## 📊 Funcionalidades Principais

- **Dashboard**: Visão geral com gráficos
- **Obrigações**: Controle de vencimentos
- **Entregas**: Registro de submissões
- **Relatórios**: Exportação CSV/Excel
- **Importação**: Upload em massa via Excel
- **Usuários**: Sistema de permissões (Admin/Fiscal/Visualizador)

## 🛠️ Tecnologias

- **Backend**: Django REST Framework + PostgreSQL/SQLite
- **Frontend**: React + Vite + TailwindCSS
- **Autenticação**: JWT
- **Deploy**: Docker Ready

## 📞 Suporte

- Consulte `setup-ambiente.md` para instruções detalhadas
- Execute `python verificar-projeto.py` para diagnósticos
- Verifique logs dos servidores em caso de erro

---

**✨ Projeto pronto para desenvolvimento e produção!**
