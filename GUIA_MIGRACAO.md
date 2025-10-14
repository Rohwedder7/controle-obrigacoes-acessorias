# 🚀 GUIA DE MIGRAÇÃO - Sistema de Aprovação de Entregas

**Data:** Outubro 2025  
**Versão:** 1.0.0

---

## 📋 CHECKLIST DE MIGRAÇÃO

Use este checklist para garantir que tudo está funcionando:

- [ ] 1. Backup do banco de dados
- [ ] 2. Aplicar migrations
- [ ] 3. Verificar integridade do banco
- [ ] 4. Criar/ajustar grupos de usuários
- [ ] 5. Atualizar submissões existentes
- [ ] 6. Instalar dependências frontend
- [ ] 7. Rebuild do frontend
- [ ] 8. Testar fluxo completo
- [ ] 9. Configurar SMTP (opcional)
- [ ] 10. Deploy

---

## 1️⃣ BACKUP DO BANCO DE DADOS

⚠️ **IMPORTANTE: Faça backup antes de qualquer coisa!**

```bash
# SQLite (desenvolvimento)
cd backend
cp db.sqlite3 db.sqlite3.backup_$(date +%Y%m%d_%H%M%S)

# PostgreSQL (produção)
pg_dump -U postgres nome_do_banco > backup_$(date +%Y%m%d_%H%M%S).sql

# MySQL (produção)
mysqldump -u usuario -p nome_do_banco > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## 2️⃣ APLICAR MIGRATIONS

### Verificar migrations pendentes

```bash
cd backend
python manage.py showmigrations core
```

**Você deve ver:**
```
core
 [X] 0001_initial
 [X] 0002_alter_company_options_company_address_and_more
 [X] 0003_remove_obligationtype_periodicity_and_more
 [X] 0004_notification
 [X] 0005_alter_obligation_validity_end_date_and_more
 [X] 0006_obligation_obligation_name
 [X] 0007_submission_batch_id_submission_submission_type_and_more
 [ ] 0008_submission_approval  ← NOVA!
```

### Aplicar a nova migration

```bash
python manage.py migrate core
```

**Saída esperada:**
```
Running migrations:
  Applying core.0008_submission_approval... OK
```

### Verificar que foi aplicada

```bash
python manage.py showmigrations core
```

**Agora deve mostrar:**
```
 [X] 0008_submission_approval  ← Aplicada!
```

---

## 3️⃣ VERIFICAR INTEGRIDADE DO BANCO

### Teste rápido no Django Shell

```bash
python manage.py shell
```

```python
# Dentro do shell
from core.models import Submission

# Verificar que novos campos existem
s = Submission.objects.first()
if s:
    print(f"Approval Status: {s.approval_status}")  # Deve mostrar: pending_review
    print(f"Is Effective: {s.is_effective}")  # Deve mostrar: True ou False
    print("✅ Campos criados com sucesso!")
else:
    print("⚠️ Nenhuma submission encontrada (ok se banco está vazio)")

exit()
```

---

## 4️⃣ CRIAR/AJUSTAR GRUPOS DE USUÁRIOS

### Criar grupo "Aprovador" (opcional)

Por padrão, Admin já pode aprovar. Mas se quiser usuários aprovadores que não sejam Admin:

```bash
python manage.py shell
```

```python
from django.contrib.auth.models import Group

# Criar grupo Aprovador
aprovador_group, created = Group.objects.get_or_create(name='Aprovador')

if created:
    print("✅ Grupo Aprovador criado!")
else:
    print("ℹ️  Grupo Aprovador já existe")

exit()
```

### Adicionar usuários ao grupo Aprovador

```bash
python manage.py shell
```

```python
from django.contrib.auth.models import User, Group

# Exemplo: adicionar usuário específico
username = 'nome_do_usuario'  # ← AJUSTE AQUI
user = User.objects.get(username=username)
aprovador = Group.objects.get(name='Aprovador')
user.groups.add(aprovador)

print(f"✅ {username} adicionado ao grupo Aprovador!")

exit()
```

### Verificar usuários Admin

```bash
python manage.py shell
```

```python
from django.contrib.auth.models import User, Group

# Listar usuários Admin
admin_group = Group.objects.get(name='Admin')
admins = User.objects.filter(groups=admin_group)

print("👥 Usuários Admin:")
for user in admins:
    print(f"  - {user.username} ({user.email})")

# Listar superusers
superusers = User.objects.filter(is_superuser=True)
print("\n👑 Superusers:")
for user in superusers:
    print(f"  - {user.username} ({user.email})")

exit()
```

---

## 5️⃣ ATUALIZAR SUBMISSÕES EXISTENTES (CRÍTICO!)

⚠️ **Todas as submissões existentes precisam ter status de aprovação!**

### Opção A: Aprovar automaticamente todas as existentes

```bash
python manage.py shell
```

```python
from core.models import Submission
from django.utils import timezone

# Obter todas as submissions sem status
submissions = Submission.objects.filter(approval_status__isnull=True)
count = submissions.count()

if count > 0:
    # Aprovar todas automaticamente
    submissions.update(
        approval_status='approved',  # Marcar como aprovadas
        approval_decision_at=timezone.now()
    )
    print(f"✅ {count} submissões antigas marcadas como aprovadas!")
else:
    # Verificar se já têm status
    all_submissions = Submission.objects.all()
    if all_submissions.exists():
        print(f"ℹ️  {all_submissions.count()} submissões já têm status definido")
    else:
        print("ℹ️  Nenhuma submissão no banco (sistema novo)")

exit()
```

### Opção B: Deixar como pending_review (para revisar)

```bash
python manage.py shell
```

```python
from core.models import Submission

# Obter todas as submissions sem status
submissions = Submission.objects.filter(approval_status__isnull=True)
count = submissions.count()

if count > 0:
    # Deixar como pending_review (default)
    # A migration já define o default, mas força aqui
    submissions.update(approval_status='pending_review')
    print(f"⚠️  {count} submissões antigas marcadas como pending_review")
    print("   Você precisará revisar cada uma manualmente!")
else:
    print("ℹ️  Todas as submissões já têm status")

exit()
```

**RECOMENDAÇÃO:** Use a Opção A para aprovar automaticamente as existentes, pois elas já foram consideradas válidas no sistema antigo.

---

## 6️⃣ INSTALAR DEPENDÊNCIAS FRONTEND

### Verificar se lucide-react está instalado

```bash
cd frontend
npm list lucide-react
```

Se não estiver instalado:

```bash
npm install lucide-react
```

### Verificar todas as dependências

```bash
npm install
```

---

## 7️⃣ REBUILD DO FRONTEND

```bash
cd frontend

# Desenvolvimento
npm run dev

# OU produção
npm run build
```

**Verifique se não há erros de compilação!**

---

## 8️⃣ TESTAR FLUXO COMPLETO

### A) Iniciar backend

```bash
cd backend
python manage.py runserver
```

### B) Iniciar frontend (em outro terminal)

```bash
cd frontend
npm run dev
```

### C) Teste manual no navegador

1. **Login como Admin:**
   - Acesse `http://localhost:5173/login`
   - Entre com credenciais de Admin

2. **Verificar novas rotas:**
   - `/approvals` - Deve abrir sem erro
   - `/my-deliveries` - Deve abrir sem erro

3. **Criar uma entrega de teste:**
   - Vá em `/submissions`
   - Crie uma entrega
   - Verifique se fica com status "Pendente de Revisão"

4. **Aprovar como Admin:**
   - Vá em `/approvals`
   - Veja a entrega na fila
   - Clique e aprove
   - Verifique se aparece nos relatórios

5. **Verificar dashboard:**
   - Vá em `/`
   - Verifique se métricas atualizam corretamente
   - Apenas entregas aprovadas devem contar como "entregues"

### D) Teste automatizado

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

## 9️⃣ CONFIGURAR SMTP (OPCIONAL)

Para enviar notificações por e-mail:

### Editar settings.py

```python
# backend/obrigacoes/settings.py

# Adicionar no final do arquivo:
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'  # ou seu servidor SMTP
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'seu-email@gmail.com'
EMAIL_HOST_PASSWORD = 'sua-senha-de-app'  # NÃO use senha normal!
DEFAULT_FROM_EMAIL = 'noreply@sistema.com'
```

**IMPORTANTE:**
- Para Gmail, use uma "Senha de App", não sua senha normal
- Vá em: https://myaccount.google.com/apppasswords
- Gere uma senha específica para o sistema

### Testar envio

```bash
python manage.py shell
```

```python
from django.core.mail import send_mail

send_mail(
    'Teste Sistema',
    'Se você recebeu este email, o SMTP está funcionando!',
    'noreply@sistema.com',
    ['seu-email-pessoal@gmail.com'],
    fail_silently=False,
)

print("✅ Email enviado! Verifique sua caixa de entrada.")
exit()
```

**Se não configurar SMTP:**
- Sistema funciona normalmente
- Notificações serão apenas in-app (sem e-mail)
- Sem erros (falha silenciosa)

---

## 🔟 DEPLOY (PRODUÇÃO)

### Checklist pré-deploy

- [ ] Migrations aplicadas
- [ ] Submissões existentes atualizadas
- [ ] Grupos de usuários configurados
- [ ] Frontend buildado (`npm run build`)
- [ ] Testes passando
- [ ] SMTP configurado (opcional)
- [ ] Backup do banco feito
- [ ] Variáveis de ambiente configuradas

### Comandos de deploy

```bash
# Backend
cd backend
python manage.py migrate
python manage.py collectstatic --noinput

# Frontend
cd frontend
npm run build

# Reiniciar serviços
sudo systemctl restart gunicorn
sudo systemctl restart nginx
```

---

## 🐛 TROUBLESHOOTING

### Erro: "no such column: core_submission.approval_status"

**Causa:** Migration não foi aplicada

**Solução:**
```bash
cd backend
python manage.py migrate core
```

---

### Erro: Frontend não compila - "Cannot find module 'lucide-react'"

**Causa:** Dependência não instalada

**Solução:**
```bash
cd frontend
npm install lucide-react
npm run dev
```

---

### Erro: Página /approvals retorna 403 Forbidden

**Causa:** Usuário não tem permissão de aprovador

**Solução:**
```bash
python manage.py shell
>>> from django.contrib.auth.models import User, Group
>>> user = User.objects.get(username='seu_usuario')
>>> admin = Group.objects.get(name='Admin')
>>> user.groups.add(admin)
>>> exit()
```

---

### Erro: Relatórios mostram 0 entregas após migração

**Causa:** Submissões antigas não foram marcadas como aprovadas

**Solução:**
```bash
python manage.py shell
>>> from core.models import Submission
>>> from django.utils import timezone
>>> Submission.objects.filter(approval_status='pending_review').update(
...     approval_status='approved',
...     approval_decision_at=timezone.now()
... )
>>> exit()
```

---

### Erro: Notificações não aparecem

**Causa:** Tipo 'approval' pode não estar registrado

**Verificar:**
```bash
python manage.py shell
>>> from core.models import Notification
>>> Notification.TYPE_CHOICES
# Deve incluir: ('approval', 'Aprovação')
>>> exit()
```

Se não tiver, a migration não foi aplicada corretamente.

---

## 📊 VERIFICAÇÃO FINAL

### Script de verificação completo

```bash
python manage.py shell
```

```python
from core.models import Submission, Notification
from django.contrib.auth.models import Group
import sys

print("="*60)
print("VERIFICAÇÃO DO SISTEMA DE APROVAÇÃO")
print("="*60)

# 1. Verificar campos do modelo
print("\n1. Verificando campos do modelo Submission...")
s = Submission.objects.first()
if s:
    try:
        status = s.approval_status
        effective = s.is_effective
        print(f"   ✅ Campos existem! Status exemplo: {status}")
    except AttributeError as e:
        print(f"   ❌ ERRO: Campos não encontrados - {e}")
        print("   → Execute: python manage.py migrate core")
        sys.exit(1)
else:
    print("   ⚠️  Nenhuma submission no banco (ok para sistema novo)")

# 2. Verificar tipo de notificação
print("\n2. Verificando tipo de notificação 'approval'...")
types = dict(Notification.TYPE_CHOICES)
if 'approval' in types:
    print(f"   ✅ Tipo 'approval' registrado: {types['approval']}")
else:
    print("   ❌ ERRO: Tipo 'approval' não encontrado")
    print("   → Execute: python manage.py migrate core")
    sys.exit(1)

# 3. Verificar grupos
print("\n3. Verificando grupos de usuários...")
try:
    admin_group = Group.objects.get(name='Admin')
    print(f"   ✅ Grupo Admin existe ({admin_group.user_set.count()} usuários)")
except Group.DoesNotExist:
    print("   ⚠️  Grupo Admin não existe")

try:
    aprovador_group = Group.objects.get(name='Aprovador')
    print(f"   ✅ Grupo Aprovador existe ({aprovador_group.user_set.count()} usuários)")
except Group.DoesNotExist:
    print("   ℹ️  Grupo Aprovador não existe (opcional)")

# 4. Verificar submissões
print("\n4. Verificando submissões...")
total = Submission.objects.count()
approved = Submission.objects.filter(approval_status='approved').count()
pending = Submission.objects.filter(approval_status='pending_review').count()
rejected = Submission.objects.filter(approval_status='rejected').count()
revision = Submission.objects.filter(approval_status='needs_revision').count()

print(f"   Total: {total}")
print(f"   Aprovadas: {approved}")
print(f"   Pendentes: {pending}")
print(f"   Recusadas: {rejected}")
print(f"   Em revisão: {revision}")

if pending > 0:
    print(f"   ⚠️  {pending} submissões pendentes de revisão!")
    print("   → Acesse /approvals para revisar")

# 5. Resultado final
print("\n" + "="*60)
print("VERIFICAÇÃO CONCLUÍDA")
print("="*60)
print("\n✅ Sistema de aprovação está pronto para uso!")
print("\nPróximos passos:")
print("  1. Acesse /approvals para ver fila de aprovação")
print("  2. Acesse /my-deliveries para ver suas entregas")
print("  3. Execute: python test_approval_flow.py (para testes)")

exit()
```

---

## ✅ CHECKLIST FINAL

Após completar todos os passos, verifique:

- [ ] ✅ Migration 0008 aplicada (`python manage.py showmigrations core`)
- [ ] ✅ Campos `approval_status` existem (`python manage.py shell`)
- [ ] ✅ Submissões antigas atualizadas (status definido)
- [ ] ✅ Grupos Admin/Aprovador configurados
- [ ] ✅ Frontend compila sem erros (`npm run build`)
- [ ] ✅ Páginas /approvals e /my-deliveries acessíveis
- [ ] ✅ Dashboard mostra métricas corretas
- [ ] ✅ Relatórios consideram apenas aprovadas
- [ ] ✅ Testes automatizados passam (10/10)
- [ ] ✅ Notificações funcionam (in-app)
- [ ] ✅ Download de anexos seguro (verifica permissões)

---

## 🎉 PRONTO!

Se todos os itens acima estão ✅, seu sistema está **100% funcional**!

**Dúvidas ou problemas?**
Consulte `FLUXO_APROVACAO.md` para documentação completa.

---

**Última atualização:** Outubro 2025  
**Versão:** 1.0.0

