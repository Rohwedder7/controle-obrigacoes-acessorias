# 🔄 GUIA: Trabalhar em Múltiplos Computadores com Git

## ✅ RESPOSTA RÁPIDA: SIM!

Você pode trabalhar no projeto em **quantos computadores quiser** e todas as alterações ficam sincronizadas via GitHub! 🎉

---

## 🖥️ CENÁRIO

- **Computador A** (atual): Onde você desenvolveu o projeto
- **Computador B** (novo): Onde você quer trabalhar também
- **GitHub**: Servidor central que mantém tudo sincronizado

---

## 📥 PASSO 1: CONFIGURAR NO COMPUTADOR B

### 1.1. Instalar Pré-requisitos

**Windows (Computador B):**
- ✅ Git: https://git-scm.com/download/win
- ✅ Python 3.10+: https://www.python.org/downloads/
- ✅ Node.js 18+: https://nodejs.org/
- ✅ Cursor: https://cursor.sh/

### 1.2. Clonar o Repositório

Abra o **PowerShell** ou **Terminal do Cursor** no Computador B:

```powershell
# Navegue até a pasta de projetos
cd C:\Users\SEU_USUARIO\Documentos

# Clone o repositório
git clone https://github.com/Rohwedder7/controle-obrigacoes-acessorias.git

# Entre na pasta
cd controle-obrigacoes-acessorias
```

### 1.3. Configurar Git (Primeira vez)

```powershell
git config user.name "Seu Nome"
git config user.email "seu-email@exemplo.com"
```

### 1.4. Instalar Dependências

**Backend:**
```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# Configurar ambiente
copy .env.example .env
# Edite .env com suas configurações (SECRET_KEY, etc)

# Preparar banco de dados
python manage.py migrate
python manage.py create_user_roles
python manage.py createsuperuser
```

**Frontend:**
```powershell
cd ..\frontend
npm install
```

### 1.5. Rodar o Projeto

**Backend (terminal 1):**
```powershell
cd backend
.venv\Scripts\activate
python manage.py runserver
```

**Frontend (terminal 2):**
```powershell
cd frontend
npm run dev
```

Acesse: http://localhost:5173 🎉

---

## 🔄 FLUXO DE TRABALHO DIÁRIO

### 📋 REGRA DE OURO
**SEMPRE puxe antes de começar, sempre envie depois de terminar!**

---

### 🏠 NO COMPUTADOR A (onde você já trabalha)

#### Antes de começar o dia:
```powershell
# 1. Puxar atualizações do GitHub
git pull origin main

# 2. Verificar se há mudanças
git status
```

#### Durante o trabalho:
```powershell
# Faça suas alterações normalmente no Cursor...
```

#### Ao terminar o dia (ou sessão):
```powershell
# 1. Ver o que mudou
git status

# 2. Adicionar todas as alterações
git add .

# 3. Fazer commit com mensagem descritiva
git commit -m "✨ Adiciona novo relatório de vendas"

# 4. Enviar para o GitHub
git push origin main
```

---

### 💻 NO COMPUTADOR B (novo computador)

#### Antes de começar:
```powershell
# 1. Puxar as últimas alterações do GitHub
git pull origin main

# 2. Verificar que está atualizado
git status
# Deve mostrar: "Your branch is up to date with 'origin/main'"
```

#### Durante o trabalho:
```powershell
# Faça suas alterações no Cursor...
```

#### Ao terminar:
```powershell
# 1. Ver o que mudou
git status

# 2. Adicionar alterações
git add .

# 3. Commit
git commit -m "🐛 Corrige bug no dashboard"

# 4. Enviar para o GitHub
git push origin main
```

---

## 🎯 EXEMPLO PRÁTICO COMPLETO

### Dia 1 - Computador A (Casa)
```powershell
# Manhã
git pull origin main  # Puxar atualizações

# Trabalhar...
# Você adiciona uma nova feature: modal de configurações

# Fim do dia
git add .
git commit -m "✨ Adiciona modal de configurações de usuário"
git push origin main  # ← Envia para o GitHub
```

### Dia 2 - Computador B (Trabalho)
```powershell
# Manhã
git pull origin main  # ← Recebe o modal de configurações que você fez ontem!

# Trabalhar...
# Você corrige um bug no relatório

# Fim do dia
git add .
git commit -m "🐛 Corrige bug de filtro no relatório"
git push origin main  # ← Envia para o GitHub
```

### Dia 3 - Computador A (Casa)
```powershell
# Manhã
git pull origin main  # ← Recebe a correção do bug que você fez no trabalho!

# Continua trabalhando...
```

**E assim por diante!** 🔄

---

## ⚠️ SITUAÇÕES IMPORTANTES

### 🚨 Conflito de Merge

Se você trabalhou nos **DOIS computadores sem fazer pull**, pode acontecer um conflito:

```powershell
git push origin main
# Erro: Updates were rejected because the remote contains work that you do not have locally
```

**Solução:**
```powershell
# 1. Puxar as alterações
git pull origin main

# 2. Se houver conflito, o Git vai avisar
# Abra os arquivos marcados com conflito e resolva manualmente

# 3. Depois de resolver:
git add .
git commit -m "🔀 Merge das alterações dos dois computadores"
git push origin main
```

### 💡 Como Evitar Conflitos

**Regras simples:**
1. ✅ **SEMPRE** `git pull` antes de começar a trabalhar
2. ✅ **SEMPRE** `git push` ao terminar
3. ✅ **NUNCA** trabalhe nos dois computadores ao mesmo tempo sem sincronizar
4. ✅ **Commits frequentes** (não espere dias para commitar)

---

## 📋 CHECKLIST DIÁRIO

### ✅ Ao COMEÇAR a trabalhar:
```powershell
cd controle-obrigacoes-acessorias
git pull origin main
git status  # Deve estar "up to date"
```

### ✅ Ao TERMINAR de trabalhar:
```powershell
git status  # Ver o que mudou
git add .
git commit -m "Descrição do que fez"
git push origin main
```

---

## 🎓 COMANDOS GIT ESSENCIAIS

### Ver Status
```powershell
git status                    # Ver arquivos modificados
git log --oneline -10         # Ver últimos 10 commits
git diff                      # Ver mudanças não commitadas
```

### Sincronização
```powershell
git pull origin main          # Puxar do GitHub
git push origin main          # Enviar para o GitHub
git fetch origin              # Só verificar sem baixar
```

### Commits
```powershell
git add .                     # Adicionar todos os arquivos
git add arquivo.py            # Adicionar arquivo específico
git commit -m "Mensagem"      # Fazer commit
git commit --amend            # Corrigir último commit
```

### Desfazer Mudanças
```powershell
git checkout -- arquivo.py    # Descartar mudanças em um arquivo
git reset --hard origin/main  # ⚠️ CUIDADO: Descartar TUDO e voltar ao GitHub
git stash                     # Guardar mudanças temporariamente
git stash pop                 # Recuperar mudanças guardadas
```

---

## 🌿 TRABALHANDO COM BRANCHES (Avançado)

Para features maiores, use branches:

```powershell
# Criar nova branch
git checkout -b feature/nova-funcionalidade

# Trabalhar normalmente...
git add .
git commit -m "Trabalho em andamento"

# Enviar branch para o GitHub
git push origin feature/nova-funcionalidade

# No outro computador, baixar a branch
git fetch origin
git checkout feature/nova-funcionalidade

# Quando terminar, fazer merge na main
git checkout main
git merge feature/nova-funcionalidade
git push origin main
```

---

## 🎯 CENÁRIO REAL: DIA A DIA

### Computador A (Segunda-feira, manhã)
```powershell
git pull origin main
# Trabalha em nova feature de notificações
git add .
git commit -m "✨ Adiciona filtro de data nas notificações"
git push origin main
```

### Computador B (Segunda-feira, tarde)
```powershell
git pull origin main  # ← Recebe a feature de notificações!
# Trabalha em correção de bug
git add .
git commit -m "🐛 Corrige erro no relatório Excel"
git push origin main
```

### Computador A (Terça-feira)
```powershell
git pull origin main  # ← Recebe a correção do bug!
# Continua trabalhando...
```

**Tudo sincronizado perfeitamente!** ✨

---

## 📱 USANDO O CURSOR

### No Cursor (Computador B):

1. **Abrir projeto:**
   ```
   File → Open Folder → controle-obrigacoes-acessorias
   ```

2. **Terminal integrado:**
   - Ctrl + ` (abre terminal)
   - Use os comandos git normalmente

3. **Git integrado:**
   - Source Control (Ctrl + Shift + G)
   - Veja mudanças visualmente
   - Commit e push pela interface

---

## ⚡ DICAS PRO

### 1. Criar Alias (Atalhos)
```powershell
# No PowerShell profile
function gitsync {
    git pull origin main
    git add .
    git commit -m $args[0]
    git push origin main
}

# Usar:
gitsync "Minha mensagem de commit"
```

### 2. Ver Histórico Visual
```powershell
git log --oneline --graph --all --decorate
```

### 3. Verificar Diferenças com o GitHub
```powershell
git fetch origin
git diff main origin/main  # Ver o que mudou no GitHub
```

### 4. Salvar Trabalho em Andamento
```powershell
# Precisa trocar de computador urgente?
git stash save "Trabalho em andamento"
git pull origin main
git push origin main

# No outro computador:
git pull origin main
git stash pop  # Recupera o trabalho
```

---

## 🔧 TROUBLESHOOTING

### Problema: "Updates were rejected"
**Causa:** Alguém (ou você no outro PC) enviou mudanças que você não tem localmente.

**Solução:**
```powershell
git pull origin main
# Resolver conflitos se houver
git push origin main
```

### Problema: "Merge conflict"
**Causa:** Você editou a mesma linha em ambos os computadores.

**Solução:**
```powershell
git pull origin main
# Git marca os conflitos nos arquivos com <<<<<<< e >>>>>>>
# Abra os arquivos, escolha qual versão manter
# Remova as marcações <<<<<<< ======= >>>>>>>
git add .
git commit -m "🔀 Resolve conflitos de merge"
git push origin main
```

### Problema: "Working tree is dirty"
**Causa:** Você tem mudanças não commitadas.

**Solução:**
```powershell
# Opção 1: Commitar antes de puxar
git add .
git commit -m "WIP: Trabalho em andamento"
git pull origin main

# Opção 2: Guardar temporariamente
git stash
git pull origin main
git stash pop
```

---

## 📚 ESTRUTURA APÓS CLONE

Quando você clonar no Computador B, terá:

```
controle-obrigacoes-acessorias/
├── backend/
│   ├── core/
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example        ← Copiar para .env
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
├── .git/                   ← Controle de versão
├── .gitignore
└── README.md
```

**⚠️ ATENÇÃO:** O `.env` NÃO vem no clone (segurança)! Você precisa:
```powershell
cd backend
copy .env.example .env
# Editar .env com suas configurações
```

---

## 🎯 WORKFLOW RECOMENDADO

### 📅 Rotina Diária

**MANHÃ (qualquer computador):**
```powershell
# 1. Abrir o Cursor
# 2. Abrir terminal integrado (Ctrl + `)
# 3. Puxar atualizações
git pull origin main

# 4. Verificar se está tudo OK
git status
```

**DURANTE O DIA:**
```powershell
# Trabalhe normalmente no Cursor
# Faça commits pequenos e frequentes
git add .
git commit -m "Descrição curta do que fez"
```

**FIM DO DIA:**
```powershell
# Enviar tudo para o GitHub
git push origin main
```

---

## 🔐 CONFIGURAÇÕES QUE NÃO SÃO SINCRONIZADAS

### ❌ Arquivos que você precisa criar manualmente em cada computador:

1. **`backend/.env`**
   ```powershell
   cd backend
   copy .env.example .env
   # Editar com suas configurações
   ```

2. **Ambiente virtual Python**
   ```powershell
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **node_modules**
   ```powershell
   cd frontend
   npm install
   ```

4. **Banco de dados SQLite**
   ```powershell
   python manage.py migrate
   python manage.py createsuperuser
   ```

**Por quê?** Esses arquivos estão no `.gitignore` por segurança e performance!

---

## 📝 BOAS PRÁTICAS

### ✅ FAÇA:
- ✅ `git pull` **ANTES** de começar a trabalhar
- ✅ `git push` **DEPOIS** de terminar
- ✅ Commits pequenos e frequentes
- ✅ Mensagens de commit descritivas
- ✅ Teste antes de fazer push

### ❌ EVITE:
- ❌ Trabalhar dias sem fazer push
- ❌ Fazer push de código com erros
- ❌ Esquecer de fazer pull
- ❌ Editar o mesmo arquivo nos dois PCs simultaneamente

---

## 🎓 COMANDOS ESSENCIAIS - COLA

### Sincronização
```powershell
git pull origin main      # ← PUXAR do GitHub
git push origin main      # ← ENVIAR para o GitHub
git status                # Ver status atual
```

### Commits
```powershell
git add .                           # Adicionar tudo
git add arquivo.py                  # Adicionar arquivo específico
git commit -m "Mensagem"            # Fazer commit
git commit -am "Mensagem"           # Add + Commit em um comando
```

### Ver Mudanças
```powershell
git log --oneline -10               # Últimos 10 commits
git diff                            # Mudanças não commitadas
git diff HEAD~1                     # Comparar com commit anterior
```

### Desfazer
```powershell
git checkout -- arquivo.py          # Descartar mudanças em arquivo
git reset HEAD~1                    # Desfazer último commit (mantém mudanças)
git reset --hard HEAD~1             # ⚠️ Desfazer último commit (APAGA mudanças)
```

---

## 🔄 EXEMPLO COMPLETO: SEMANA DE TRABALHO

### Segunda - Computador A (Casa)
```powershell
git pull origin main
# Trabalha 3 horas
git add .
git commit -m "✨ Nova página de configurações"
git push origin main
```

### Terça - Computador B (Trabalho)
```powershell
git pull origin main  # ← Recebe a página de configurações
# Trabalha 5 horas
git add .
git commit -m "🎨 Melhora UI do dashboard"
git push origin main
```

### Quarta - Computador A (Casa)
```powershell
git pull origin main  # ← Recebe as melhorias do dashboard
# Trabalha 2 horas
git add .
git commit -m "🐛 Corrige bug no filtro"
git push origin main
```

### Quinta - Computador B (Trabalho)
```powershell
git pull origin main  # ← Recebe a correção do bug
# Trabalha...
```

**Tudo sincronizado automaticamente!** ✨

---

## 🎨 USANDO A INTERFACE DO CURSOR

### Source Control (Ctrl + Shift + G)

O Cursor tem interface visual do Git:

1. **Ver mudanças:**
   - Ícone "Source Control" na barra lateral
   - Lista todos os arquivos modificados

2. **Fazer commit:**
   - Digite mensagem na caixa
   - Clique no ✓ (check)

3. **Push/Pull:**
   - Clique nos "..." (três pontos)
   - "Pull" ou "Push"

**É mais visual, mas os comandos são mais poderosos!**

---

## 🔍 VERIFICAR SINCRONIZAÇÃO

### Comando útil:
```powershell
# Ver se está sincronizado com o GitHub
git fetch origin
git status
```

**Respostas possíveis:**

✅ **"Your branch is up to date with 'origin/main'"**
→ Tudo sincronizado!

⚠️ **"Your branch is ahead of 'origin/main' by 2 commits"**
→ Você tem 2 commits locais não enviados. Faça `git push`

⚠️ **"Your branch is behind 'origin/main' by 3 commits"**
→ Tem 3 commits no GitHub que você não tem. Faça `git pull`

---

## 🎯 SETUP RÁPIDO - COMPUTADOR B

### Script Completo (copie e cole):

```powershell
# 1. Clone
git clone https://github.com/Rohwedder7/controle-obrigacoes-acessorias.git
cd controle-obrigacoes-acessorias

# 2. Configure Git
git config user.name "Seu Nome"
git config user.email "seu-email@exemplo.com"

# 3. Backend
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# ← Edite .env manualmente
python manage.py migrate
python manage.py create_user_roles
python manage.py createsuperuser

# 4. Frontend (novo terminal)
cd ..\frontend
npm install

# 5. Rodar (2 terminais)
# Terminal 1: cd backend; .venv\Scripts\activate; python manage.py runserver
# Terminal 2: cd frontend; npm run dev
```

---

## 📞 DÚVIDAS COMUNS

### P: Os dados do banco vêm também?
**R:** NÃO. O `db.sqlite3` está no `.gitignore`. Você precisa criar o banco novo no Computador B com `python manage.py migrate`.

### P: E se eu criar empresas/obrigações no Computador B?
**R:** Elas ficam apenas no banco local daquele computador. Para sincronizar dados, use:
- Export Excel → commit o arquivo → import no outro PC
- Ou use PostgreSQL em servidor compartilhado

### P: Posso trabalhar offline?
**R:** SIM! Commits funcionam offline. Quando voltar online, faça `git push`.

### P: E se eu esquecer de fazer pull?
**R:** Ao tentar push, o Git vai reclamar. Faça `git pull` primeiro, resolva conflitos (se houver) e depois `git push`.

### P: Posso usar 3, 4, 5 computadores?
**R:** SIM! Sem limite. Sempre `pull` antes, `push` depois.

---

## 🎉 BENEFÍCIOS

### ✅ Vantagens desse Workflow:

1. **Flexibilidade:** Trabalhe de qualquer lugar
2. **Backup automático:** Código sempre no GitHub
3. **Histórico completo:** Cada mudança fica registrada
4. **Colaboração:** Outras pessoas podem contribuir
5. **Portfólio:** Repositório público mostra seu trabalho
6. **Reversão:** Pode voltar a qualquer versão anterior

---

## 🚀 RESUMO ULTRA-RÁPIDO

### Computador NOVO (primeira vez):
```powershell
git clone https://github.com/Rohwedder7/controle-obrigacoes-acessorias.git
cd controle-obrigacoes-acessorias
# Seguir README.md para instalar dependências
```

### TODO DIA (qualquer computador):
```powershell
# ANTES de trabalhar:
git pull origin main

# DEPOIS de trabalhar:
git add .
git commit -m "O que você fez"
git push origin main
```

---

## 🎊 PRONTO!

Agora você pode:
- ✅ Trabalhar em casa
- ✅ Trabalhar no escritório
- ✅ Trabalhar no notebook
- ✅ Trabalhar em qualquer lugar

**Tudo sincronizado via GitHub!** 🔄

---

## 📖 REFERÊNCIAS

- Documentação Git: https://git-scm.com/doc
- GitHub Docs: https://docs.github.com/
- Tutorial Git em PT-BR: https://git-scm.com/book/pt-br/v2

---

**Criado em:** 14/10/2024  
**Versão:** 1.0  
**Status:** ✅ Completo  
**Para:** Trabalho em múltiplos computadores com Git/GitHub

