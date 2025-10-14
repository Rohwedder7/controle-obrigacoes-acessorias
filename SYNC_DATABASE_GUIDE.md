# 💾 GUIA: Sincronizar Banco de Dados entre Computadores

## 🎯 SOLUÇÃO RECOMENDADA: PostgreSQL na Nuvem

### ⚡ SETUP RÁPIDO (5 minutos)

#### 1️⃣ Criar Banco Gratuito

**Opção A - ElephantSQL (Mais fácil):**
1. Acesse: https://www.elephantsql.com/
2. Sign Up (grátis)
3. Create New Instance
   - Name: `obrigacoes-db`
   - Plan: Tiny Turtle (Free)
   - Region: escolha o mais próximo
4. Copie a **URL** (algo como: `postgres://user:pass@silly.db.elephantsql.com:5432/database`)

**Opção B - Supabase (Mais recursos):**
1. Acesse: https://supabase.com/
2. New Project
3. Pegue a connection string em Settings → Database

**Opção C - Render (Simples):**
1. Acesse: https://render.com/
2. New → PostgreSQL
3. Free tier
4. Copie a Internal Database URL

#### 2️⃣ Configurar AMBOS os Computadores

**Computador A:**
```powershell
cd backend
# Edite .env
# Adicione a linha:
DATABASE_URL=postgres://usuario:senha@host:5432/database
```

**Computador B:**
```powershell
cd backend
# Edite .env
# Adicione a MESMA linha:
DATABASE_URL=postgres://usuario:senha@host:5432/database
```

#### 3️⃣ Migrar (SÓ UMA VEZ - Computador A)

```powershell
cd backend
python manage.py migrate
python manage.py create_user_roles
python manage.py createsuperuser

# Criar dados iniciais
python manage.py seed_states
```

#### 4️⃣ Usar no Computador B

```powershell
cd backend
python manage.py migrate  # Só pra garantir
python manage.py runserver

# OS DADOS JÁ ESTÃO LÁ! 🎉
```

### ✅ Pronto! Dados universais!

Agora:
- ✅ Crie uma empresa no Computador A → aparece no B
- ✅ Adicione obrigação no Computador B → aparece no A
- ✅ Mesmo banco de dados
- ✅ Sempre sincronizado
- ✅ Zero conflitos

---

## 🔄 ALTERNATIVA: Script de Backup/Restore

Se preferir manter SQLite local, use o script que criei:

### 📤 Exportar dados (Computador A):

```powershell
cd backend
python sync_database.py export

# Isso cria: database_sync.json

# Commitar:
git add database_sync.json
git commit -m "💾 Backup de dados"
git push origin main
```

### 📥 Importar dados (Computador B):

```powershell
# Puxar backup
git pull origin main

cd backend
python sync_database.py import

# Os dados foram importados! ✅
```

### ⚠️ Limitações:
- ❌ Não é automático (precisa exportar/importar manualmente)
- ❌ Pode ter conflitos se trabalhar nos 2 PCs simultaneamente
- ❌ Arquivo JSON pode ficar grande

---

## 🚫 SOLUÇÃO NÃO RECOMENDADA: Commitar SQLite

Se você **REALMENTE** quer commitar o banco SQLite (não recomendo):

### Passo 1: Remover do .gitignore

```powershell
# Edite .gitignore e comente a linha:
# db.sqlite3
```

### Passo 2: Adicionar ao Git

```powershell
cd backend
git add db.sqlite3
git commit -m "💾 Adiciona banco de dados SQLite (não recomendado)"
git push origin main
```

### ⚠️ PROBLEMAS que você terá:

1. **Conflitos constantes:**
   ```
   Auto-merging backend/db.sqlite3
   CONFLICT (binary file merge conflict)
   ```
   → Você perde dados!

2. **Repositório pesado:**
   - Cada mudança = arquivo binário completo
   - 10 commits = 10x o tamanho do banco

3. **Corrupção:**
   - Git merge pode corromper o SQLite
   - Você pode perder TUDO

**POR ISSO NÃO RECOMENDO!** 🚨

---

## 🏆 COMPARAÇÃO DAS SOLUÇÕES

| Solução | Automático | Conflitos | Complexidade | Recomendado |
|---------|------------|-----------|--------------|-------------|
| **PostgreSQL Nuvem** | ✅ | ✅ Nenhum | ⭐⭐ Médio | ✅✅✅ SIM! |
| **Backup JSON + Git** | ❌ Manual | ⚠️ Pode ter | ⭐ Fácil | ⚠️ OK |
| **SQLite no Git** | ✅ | ❌ MUITOS | ⭐ Fácil | ❌ NÃO! |

---

## 🎯 RECOMENDAÇÃO FINAL

### 🏅 MELHOR SOLUÇÃO: PostgreSQL na Nuvem

**Por quê?**
- ✅ **Dados sempre sincronizados** em tempo real
- ✅ **Zero conflitos** de merge
- ✅ **Gratuito** (com limitações razoáveis)
- ✅ **Profissional** (mesma solução de produção)
- ✅ **5 minutos** para configurar

**Como fazer agora:**

1. Crie conta no ElephantSQL: https://www.elephantsql.com/
2. Crie banco gratuito
3. Copie a URL
4. Nos DOIS computadores, adicione no `.env`:
   ```
   DATABASE_URL=postgres://...
   ```
5. Pronto! Dados universais! 🎉

---

## 📋 QUER FAZER AGORA?

Escolha uma opção:

**A) PostgreSQL na Nuvem (RECOMENDADO)** ⭐⭐⭐
- Te ajudo a configurar agora
- 5 minutos de setup
- Dados sempre sincronizados

**B) Script Backup/Restore (OK)** ⭐⭐
- Criei o script `sync_database.py`
- Você exporta, commita, e importa
- Manual mas funciona

**C) Commitar SQLite (NÃO RECOMENDO)** ⭐
- Vou fazer se você insistir
- Mas vai ter problemas de conflito

---

## 🚀 VAMOS FAZER A SOLUÇÃO A?

Me confirme e eu:
1. ✅ Configuro o settings.py para usar PostgreSQL
2. ✅ Crio um guia passo-a-passo para ElephantSQL
3. ✅ Atualizo o .env.example
4. ✅ Faço backup dos seus dados SQLite atuais
5. ✅ Migro tudo para o Postgres
6. ✅ Commito e envio para o GitHub

**Qual opção prefere?** (A, B ou C)

---

## 💡 ENQUANTO ISSO...

Vou atualizar o guia com informações sobre sincronização de dados:

<function_calls>
<invoke name="run_terminal_cmd">
<parameter name="command">git add backend/sync_database.py SYNC_DATABASE_GUIDE.md
