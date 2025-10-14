# ⚡ INÍCIO RÁPIDO - Sistema de Aprovação

## 🎯 O QUE VOCÊ PRECISA FAZER AGORA

---

## OPÇÃO 1: Script Automatizado (RECOMENDADO) ⭐

```bash
# Execute este único comando:
python verificar_instalacao.py
```

O script vai:
- ✅ Verificar todos os arquivos
- ✅ Perguntar se quer migrar automaticamente
- ✅ Mostrar o que fazer depois

---

## OPÇÃO 2: Manual (Passo a Passo)

### **Passo 1: Aplicar Migration** (OBRIGATÓRIO)

```bash
cd backend
python manage.py migrate
```

✅ **Resultado esperado:**
```
Running migrations:
  Applying core.0008_submission_approval... OK
```

---

### **Passo 2: Atualizar Entregas Antigas** (OBRIGATÓRIO)

```bash
python manage.py shell
```

Cole isto dentro do shell:

```python
from core.models import Submission
from django.utils import timezone

# Aprovar automaticamente todas as entregas antigas
updated = Submission.objects.all().update(
    approval_status='approved',
    approval_decision_at=timezone.now()
)

print(f"✅ {updated} entregas atualizadas!")
exit()
```

---

### **Passo 3: Instalar Dependência Frontend** (OBRIGATÓRIO)

```bash
cd frontend
npm install lucide-react
npm install
```

---

### **Passo 4: Rebuild Frontend**

```bash
# Ainda em frontend/
npm run build
```

**OU para desenvolvimento:**
```bash
npm run dev
```

---

### **Passo 5: Reiniciar Servidores**

**Terminal 1 - Backend:**
```bash
cd backend
python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

### **Passo 6: Testar no Navegador**

Abra: `http://localhost:5173`

**Login como Admin e veja:**

✅ **No menu superior deve aparecer:**
- 📦 Minhas Entregas (todos os usuários)
- ✔️ Aprovações (só Admin/Aprovador)

✅ **Acesse as páginas:**
- `http://localhost:5173/my-deliveries` - Suas entregas
- `http://localhost:5173/approvals` - Fila de aprovação (Admin)

---

## 🧪 **Passo 7: Executar Testes**

```bash
# Backend deve estar rodando!
python test_approval_flow.py
```

**Resultado esperado:**
```
✅ TODOS OS TESTES PASSARAM!
Total: 10/10 testes passaram (100.0%)
```

---

## 🎯 **VERIFICAÇÃO RÁPIDA**

Execute este comando no shell do Django para verificar se tudo está OK:

```bash
python manage.py shell
```

```python
from core.models import Submission, Notification
from django.contrib.auth.models import Group

# 1. Verificar campos
s = Submission.objects.first()
print(f"Status: {s.approval_status if s else 'Sem submissions'}")
print(f"Efetivo: {s.is_effective if s else 'Sem submissions'}")

# 2. Verificar tipo de notificação
types = dict(Notification.TYPE_CHOICES)
print(f"Tipo 'approval' existe: {'approval' in types}")

# 3. Verificar grupos
print(f"Grupo Admin: {Group.objects.filter(name='Admin').exists()}")
print(f"Grupo Aprovador: {Group.objects.filter(name='Aprovador').exists()}")

print("\n✅ Se tudo acima funcionou, o sistema está pronto!")
exit()
```

---

## ❓ **PROBLEMAS COMUNS**

### Problema: "no such column: core_submission.approval_status"

**Solução:**
```bash
cd backend
python manage.py migrate core
```

---

### Problema: "Cannot find module 'lucide-react'"

**Solução:**
```bash
cd frontend
npm install lucide-react
npm run build
```

---

### Problema: Páginas /approvals e /my-deliveries não aparecem

**Solução 1 - Verificar rotas:**
```bash
grep -n "approvals\|my-deliveries" frontend/src/main.jsx
```

Deve mostrar as rotas. Se não mostrar, o arquivo não foi salvo.

**Solução 2 - Limpar cache do navegador:**
- Pressione `Ctrl + Shift + R` (Windows/Linux)
- Pressione `Cmd + Shift + R` (Mac)

**Solução 3 - Rebuild:**
```bash
cd frontend
npm run build
# Reinicie o servidor
```

---

### Problema: Links não aparecem no menu

**Solução:**
```bash
# Verificar se Header.jsx foi atualizado
grep -n "Aprovações\|Minhas Entregas" frontend/src/components/Header.jsx
```

Se não aparecer, o Header não foi salvo corretamente. Execute novamente.

---

### Problema: Erro 403 ao acessar /approvals

**Solução - Adicionar usuário ao grupo Admin:**
```bash
python manage.py shell
>>> from django.contrib.auth.models import User, Group
>>> user = User.objects.get(username='seu_usuario')  # ← SEU USUÁRIO
>>> admin = Group.objects.get(name='Admin')
>>> user.groups.add(admin)
>>> print("✅ Usuário adicionado ao grupo Admin!")
>>> exit()
```

---

## 📊 **COMO TESTAR SE FUNCIONOU**

### 1. Login como usuário comum
- Vá em "Entregas" e crie uma entrega
- Veja que ela fica "Pendente de Revisão"
- Vá em "Minhas Entregas" - deve aparecer lá
- Não deve ter opção "Aprovações" no menu

### 2. Login como Admin
- Vá em "Aprovações" no menu
- Deve ver a entrega criada na fila
- Clique nela e aprove
- Vá em "Dashboard" - deve contar como entregue

### 3. Verificar relatórios
- Vá em "Relatórios"
- Apenas entregas aprovadas devem aparecer como "entregue"

---

## ✅ **CHECKLIST FINAL**

Marque conforme for completando:

- [ ] Migration aplicada (`python manage.py migrate`)
- [ ] Submissões antigas atualizadas (script ou manual)
- [ ] `lucide-react` instalado (`npm install lucide-react`)
- [ ] Frontend buildado (`npm run build` ou `npm run dev`)
- [ ] Backend rodando (`python manage.py runserver`)
- [ ] Frontend rodando (`npm run dev`)
- [ ] Página /approvals acessível (Admin)
- [ ] Página /my-deliveries acessível (todos)
- [ ] Links aparecem no menu
- [ ] Testes passam (`python test_approval_flow.py`)

---

## 🎉 **PRONTO!**

Se todos os itens acima estão marcados, seu sistema está funcionando perfeitamente!

**Dúvidas?**
- `GUIA_MIGRACAO.md` - Guia completo
- `FLUXO_APROVACAO.md` - Documentação da API

---

**Tempo estimado:** 5-10 minutos  
**Dificuldade:** ⭐⭐ Fácil

