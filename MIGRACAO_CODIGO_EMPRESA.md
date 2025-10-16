# Migração - Campo Código nas Empresas

## 📋 Resumo das Alterações

Foi implementada uma melhoria no sistema para adicionar um campo **"código"** como identificador único nas empresas. Este campo é obrigatório e único, facilitando a identificação e organização das empresas no sistema.

## ✅ Alterações Implementadas

### Backend

1. **Modelo Company** (`backend/core/models.py`)
   - Adicionado campo `code` (CharField, max_length=50, unique=True)
   - Campo obrigatório e único
   - Ordenação alterada para usar o código
   - Método `__str__` atualizado para exibir o código

2. **Serializer** (`backend/core/serializers.py`)
   - Campo `code` adicionado ao CompanySerializer

3. **Views** (`backend/core/views.py`)
   - `bulk_import_companies`: Atualizado para aceitar código na primeira coluna
   - `bulk_import_obligations`: Atualizado para buscar empresa pelo código ao invés do nome
   - Validação de código único implementada

4. **Migration** (`backend/core/migrations/0010_add_company_code.py`)
   - Migration criada para adicionar o campo código

### Frontend

1. **Página de Empresas** (`frontend/src/pages/Companies.jsx`)
   - Campo código adicionado ao formulário
   - Campo desabilitado durante edição (código não pode ser alterado)
   - Código exibido em destaque nos cards de empresas

2. **Página de Obrigações** (`frontend/src/pages/Obligations.jsx`)
   - Dropdown de empresas atualizado para mostrar código
   - Formato: `[CÓDIGO] Nome da Empresa`

3. **Página de Entregas** (`frontend/src/pages/Submissions.jsx`)
   - Dropdown de empresas atualizado para mostrar código

4. **Página de Aprovações** (`frontend/src/pages/Approvals.jsx`)
   - Lista de empresas atualizada para mostrar código
   - Detalhes da empresa mostram código

5. **Página de Relatórios** (`frontend/src/pages/Reports.jsx`)
   - Checkboxes de empresas atualizados para mostrar código

6. **Página de Relatórios Avançados** (`frontend/src/pages/AdvancedReports.jsx`)
   - Dropdown de empresas atualizado para mostrar código

7. **Página de Planejamento** (`frontend/src/pages/Planning.jsx`)
   - Dropdown de empresas atualizado para mostrar código

8. **Dashboard** (`frontend/src/pages/Dashboard.jsx`)
   - Tabela de empresas atualizada para mostrar código

### Template Excel

- **Template de Empresas** (`backend/media/templates/template_empresas.xlsx`)
  - Coluna "Código" adicionada como primeira coluna
  - Ordem das colunas: Código, Razão Social, CNPJ, Nome Fantasia, E-mail, Telefone, Endereço, Responsável

## 🚀 Como Aplicar a Migração

### Passo 1: Fazer Backup do Banco de Dados

```bash
# No diretório backend
python manage.py dumpdata core.Company > backup_empresas.json
```

### Passo 2: Aplicar a Migration

```bash
# No diretório backend
python manage.py migrate core
```

### Passo 3: Atualizar Empresas Existentes

**IMPORTANTE:** As empresas existentes precisam ter o campo código preenchido. Você tem duas opções:

#### Opção A: Usar Script Automático

Execute o script Python abaixo para adicionar códigos automáticos às empresas existentes:

```python
# backend/add_codes_to_existing_companies.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'obrigacoes.settings')
django.setup()

from core.models import Company

# Adicionar códigos às empresas existentes
companies = Company.objects.filter(code='').order_by('id')

for idx, company in enumerate(companies, start=1):
    # Gerar código baseado no ID: EMP001, EMP002, etc.
    code = f"EMP{idx:03d}"
    
    # Verificar se o código já existe
    while Company.objects.filter(code=code).exists():
        idx += 1
        code = f"EMP{idx:03d}"
    
    company.code = code
    company.save()
    print(f"Empresa {company.name} recebeu o código: {code}")

print(f"\n✅ {companies.count()} empresas atualizadas com sucesso!")
```

Execute o script:

```bash
python backend/add_codes_to_existing_companies.py
```

#### Opção B: Atualizar Manualmente

1. Acesse o Django Admin: http://localhost:8000/admin/
2. Vá em "Empresas"
3. Para cada empresa, adicione um código único
4. Salve as alterações

### Passo 4: Verificar a Migração

```bash
# Verificar se todas as empresas têm código
python manage.py shell
```

No shell do Django:

```python
from core.models import Company

# Verificar empresas sem código
sem_codigo = Company.objects.filter(code='')
print(f"Empresas sem código: {sem_codigo.count()}")

# Listar todas as empresas com seus códigos
for company in Company.objects.all():
    print(f"{company.code} - {company.name}")
```

### Passo 5: Testar o Sistema

1. **Cadastro Individual:**
   - Acesse a página de Empresas
   - Clique em "Nova Empresa"
   - Preencha o código (obrigatório)
   - Salve e verifique se o código aparece no card

2. **Cadastro em Massa:**
   - Baixe o novo template de empresas
   - Preencha a coluna "Código" (primeira coluna)
   - Faça upload do arquivo
   - Verifique se as empresas foram criadas corretamente

3. **Cadastro de Obrigações:**
   - Acesse a página de Obrigações
   - Ao selecionar uma empresa, verifique se o código aparece no formato `[CÓDIGO] Nome`

4. **Relatórios:**
   - Acesse os relatórios
   - Verifique se as empresas aparecem com o código

## 📝 Notas Importantes

1. **Código Único:** O código deve ser único para cada empresa
2. **Não Editar:** Após a criação, o código não pode ser alterado
3. **Template Excel:** Use sempre o novo template para importação em massa
4. **Compatibilidade:** O sistema continua funcionando normalmente, apenas com o código adicional

## 🔧 Solução de Problemas

### Erro: "Campo 'code' não pode ser nulo"

Se você receber este erro, significa que há empresas sem código. Execute o script de atualização automática (Passo 3, Opção A).

### Erro: "Código já existe"

Certifique-se de que cada empresa tem um código único. Se necessário, ajuste os códigos manualmente.

### Empresas não aparecem nos dropdowns

Limpe o cache do navegador e recarregue a página.

## 📊 Formato do Código

Recomendações para criar códigos:
- Use letras e números
- Máximo 50 caracteres
- Sugestão: `EMP001`, `CLI001`, `FOR001`, etc.
- Evite caracteres especiais

## ✅ Checklist de Verificação

- [ ] Backup do banco de dados realizado
- [ ] Migration aplicada com sucesso
- [ ] Empresas existentes atualizadas com códigos
- [ ] Template Excel atualizado
- [ ] Cadastro individual testado
- [ ] Cadastro em massa testado
- [ ] Dropdowns mostram o código
- [ ] Relatórios exibem o código
- [ ] Sistema funcionando normalmente

## 📞 Suporte

Se encontrar problemas durante a migração, verifique:
1. Logs do Django: `python manage.py runserver`
2. Console do navegador (F12)
3. Verifique se todas as migrations foram aplicadas: `python manage.py showmigrations`

---

**Data da Implementação:** Janeiro 2025
**Versão:** 1.0
**Status:** ✅ Implementado e Testado

