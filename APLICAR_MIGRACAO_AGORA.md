# 🚀 Aplicar Migração - Campo Código nas Empresas

## ⚡ Instruções Rápidas

### Opção 1: Usando o Script Batch (Recomendado)

1. **Feche o servidor Django** se estiver rodando (Ctrl+C)

2. **Execute o script batch:**
   ```
   aplicar_migracao.bat
   ```

3. **Reinicie o servidor:**
   ```bash
   cd backend
   python manage.py runserver
   ```

4. **Pronto!** Acesse o sistema e verifique se os códigos aparecem

---

### Opção 2: Manual (Passo a Passo)

#### Passo 1: Aplicar a Migration

Abra o terminal/PowerShell e execute:

```bash
cd backend
python manage.py migrate core
```

Você verá algo como:
```
Running migrations:
  Applying core.0010_add_company_code... OK
```

#### Passo 2: Adicionar Códigos às Empresas Existentes

Execute o script Python:

```bash
python add_codes_to_existing_companies.py
```

Você verá algo como:
```
============================================================
SCRIPT DE ATUALIZAÇÃO DE CÓDIGOS DAS EMPRESAS
============================================================

📊 Total de empresas sem código: 3

Gerando códigos automáticos...

✅ Empresa Exemplo Ltda → Código: EMP001
✅ Outra Empresa S.A. → Código: EMP002
✅ Terceira Empresa → Código: EMP003

============================================================
✅ 3 empresas atualizadas com sucesso!
============================================================
```

#### Passo 3: Reiniciar o Servidor

```bash
python manage.py runserver
```

#### Passo 4: Testar

1. Acesse http://localhost:8000 ou http://localhost:5173
2. Vá em "Empresas"
3. Verifique se os códigos aparecem nos cards: `[EMP001] Nome da Empresa`
4. Teste cadastrar uma nova empresa (código obrigatório)

---

## ✅ Verificação

### Como Saber se Funcionou?

**Backend (Django Admin):**
1. Acesse http://localhost:8000/admin/
2. Vá em "Empresas"
3. Verifique se cada empresa tem um código

**Frontend:**
1. Acesse http://localhost:5173
2. Vá em "Empresas"
3. Os cards devem mostrar: `[EMP001] Nome da Empresa`
4. Ao clicar em "Nova Empresa", o campo código deve aparecer

---

## 🔧 Solução de Problemas

### Erro: "Campo 'code' não pode ser nulo"

**Solução:** Execute o script de atualização:
```bash
cd backend
python add_codes_to_existing_companies.py
```

### Erro: "Código já existe"

**Solução:** O script gera códigos únicos automaticamente. Se ainda assim der erro, verifique manualmente no Django Admin.

### Empresas não aparecem com código

**Solução:** 
1. Limpe o cache do navegador (Ctrl+Shift+Del)
2. Recarregue a página (Ctrl+F5)
3. Verifique se a migration foi aplicada: `python manage.py showmigrations core`

### Erro ao executar migration

**Solução:**
1. Faça backup do banco de dados primeiro:
   ```bash
   python manage.py dumpdata core.Company > backup_empresas.json
   ```
2. Tente novamente a migration
3. Se falhar, restaure o backup:
   ```bash
   python manage.py loaddata backup_empresas.json
   ```

---

## 📝 Checklist

Marque conforme for completando:

- [ ] Servidor Django parado
- [ ] Migration aplicada (`python manage.py migrate core`)
- [ ] Códigos adicionados às empresas (`python add_codes_to_existing_companies.py`)
- [ ] Servidor reiniciado
- [ ] Códigos aparecem nos cards de empresas
- [ ] Campo código aparece no formulário de nova empresa
- [ ] Dropdowns mostram o código
- [ ] Sistema funcionando normalmente

---

## 🎯 Resultado Esperado

### Antes da Migração
```
Empresas
┌─────────────────────────────┐
│ Empresa Exemplo Ltda        │
│ CNPJ: 12.345.678/0001-90    │
│ [Editar] [Excluir]          │
└─────────────────────────────┘
```

### Depois da Migração
```
Empresas
┌─────────────────────────────┐
│ [EMP001] Empresa Exemplo Ltda│
│ CNPJ: 12.345.678/0001-90    │
│ [Editar] [Excluir]          │
└─────────────────────────────┘
```

---

## 📞 Precisa de Ajuda?

Se encontrar problemas:

1. **Verifique os logs do Django:**
   - Procure por erros no terminal onde o servidor está rodando

2. **Verifique o banco de dados:**
   ```bash
   python manage.py shell
   ```
   No shell:
   ```python
   from core.models import Company
   Company.objects.all()
   ```

3. **Verifique as migrations:**
   ```bash
   python manage.py showmigrations core
   ```
   Deve mostrar `[X] 0010_add_company_code`

---

## ✨ Pronto!

Após seguir esses passos, seu sistema estará atualizado com o campo código nas empresas!

**Tempo estimado:** 2-5 minutos

---

**Desenvolvido com ❤️ para o Sistema de Controle de Obrigações Acessórias**

