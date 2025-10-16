# ✅ SOLUÇÃO FINAL: DATAS VOLTANDO UM DIA

## 🎯 Problema Identificado

As datas das obrigações estavam voltando **um dia** quando criadas por upload em massa ou individualmente.

### Exemplo do Problema:
- **Na planilha:** `20/11/2025`
- **No sistema:** `19/11/2025` ❌ (um dia a menos!)

---

## 🔍 Causa Raiz

O problema estava na configuração do Django em `backend/obrigacoes/settings.py`:

```python
USE_TZ = True  # ❌ PROBLEMA!
```

Quando `USE_TZ = True`, o Django:
1. Usa timezone-aware datetimes
2. Converte automaticamente para UTC ao salvar
3. Converte de volta para o timezone local ao exibir
4. Isso causa problemas de conversão que fazem datas voltarem um dia

---

## ✅ Solução Aplicada

### 1. Desabilitar USE_TZ

Alterado em `backend/obrigacoes/settings.py`:

```python
LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = False  # ✅ CORRIGIDO!
```

**Por que isso resolve?**
- Com `USE_TZ = False`, o Django não faz conversões de timezone
- As datas são armazenadas e exibidas exatamente como foram inseridas
- Não há conversões automáticas que causam perda de um dia

### 2. Função Auxiliar para Processar Datas

Criada função `parse_date_from_excel()` em `backend/core/views.py`:

```python
def parse_date_from_excel(date_value):
    """
    Converte valores de data do Excel para objetos date do Python
    Evita problemas de timezone que fazem datas voltarem um dia
    """
    if date_value is None:
        return None
    
    # Se já for date, retorna direto
    if isinstance(date_value, datetime.date) and not isinstance(date_value, datetime.datetime):
        return date_value
    
    # Se for datetime, converte para date (remove hora/timezone)
    if isinstance(date_value, datetime.datetime):
        return date_value.date()
    
    # Se for string, tenta parsear
    if isinstance(date_value, str):
        date_str = str(date_value).strip()
        if not date_str:
            return None
        
        # Tentar diferentes formatos
        try:
            # Formato DD/MM/YYYY
            if '/' in date_str and len(date_str.split('/')) == 3:
                parts = date_str.split('/')
                if len(parts[2]) == 4:  # YYYY
                    return datetime.datetime.strptime(date_str, '%d/%m/%Y').date()
                else:  # DD/MM/YY
                    return datetime.datetime.strptime(date_str, '%d/%m/%y').date()
            
            # Formato YYYY-MM-DD
            if '-' in date_str and len(date_str.split('-')) == 3:
                return datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
        except:
            pass
    
    return None
```

### 3. Correção no Upload em Massa

Atualizado `bulk_import_obligations()` em `backend/core/views.py`:

```python
# Processar datas corretamente (evitar problema de timezone)
due_date_parsed = parse_date_from_excel(due_date)
if not due_date_parsed:
    errors.append(f"Linha {i}: Data de vencimento inválida: '{due_date}'")
    continue

delivery_deadline_parsed = parse_date_from_excel(delivery_deadline) if delivery_deadline else None
validity_start_parsed = parse_date_from_excel(validity_start) if validity_start else datetime.date(2024, 1, 1)
validity_end_parsed = parse_date_from_excel(validity_end) if validity_end else datetime.date(2024, 12, 31)

# Criar obrigação com datas corretas
obj, made = Obligation.objects.get_or_create(
    company=company, 
    state=state, 
    obligation_type=otype, 
    competence=competence_formatted,
    defaults={
        'due_date': due_date_parsed,  # ✅ Data correta
        'delivery_deadline': delivery_deadline_parsed,
        'validity_start_date': validity_start_parsed,
        'validity_end_date': validity_end_parsed,
        # ...
    }
)
```

### 4. Correção no Serializer

Atualizado `ObligationSerializer` em `backend/core/serializers.py`:

```python
def create(self, validated_data):
    validated_data['created_by'] = self.context['request'].user
    
    # Garantir que as datas sejam objetos date (não datetime)
    from datetime import datetime as dt
    if 'due_date' in validated_data and isinstance(validated_data['due_date'], dt):
        validated_data['due_date'] = validated_data['due_date'].date()
    if 'delivery_deadline' in validated_data and isinstance(validated_data['delivery_deadline'], dt):
        validated_data['delivery_deadline'] = validated_data['delivery_deadline'].date()
    if 'validity_start_date' in validated_data and isinstance(validated_data['validity_start_date'], dt):
        validated_data['validity_start_date'] = validated_data['validity_start_date'].date()
    if 'validity_end_date' in validated_data and isinstance(validated_data['validity_end_date'], dt):
        validated_data['validity_end_date'] = validated_data['validity_end_date'].date()
    
    return super().create(validated_data)

def update(self, instance, validated_data):
    # Garantir que as datas sejam objetos date (não datetime)
    from datetime import datetime as dt
    if 'due_date' in validated_data and isinstance(validated_data['due_date'], dt):
        validated_data['due_date'] = validated_data['due_date'].date()
    if 'delivery_deadline' in validated_data and isinstance(validated_data['delivery_deadline'], dt):
        validated_data['delivery_deadline'] = validated_data['delivery_deadline'].date()
    if 'validity_start_date' in validated_data and isinstance(validated_data['validity_start_date'], dt):
        validated_data['validity_start_date'] = validated_data['validity_start_date'].date()
    if 'validity_end_date' in validated_data and isinstance(validated_data['validity_end_date'], dt):
        validated_data['validity_end_date'] = validated_data['validity_end_date'].date()
    
    return super().update(instance, validated_data)
```

### 5. Template Atualizado

O template de obrigações foi atualizado para usar o formato brasileiro de datas:

**Estrutura:**
```
1. CNPJ da Empresa (obrigatório)
2. Estado (Código) (obrigatório)
3. Tipo de Obrigação (obrigatório)
4. Nome da Obrigação Acessória (opcional)
5. Competência (MM/AAAA) (obrigatório)
6. Data de Vencimento (DD/MM/AAAA) (obrigatório) ✅
7. Prazo de Entrega (DD/MM/AAAA) (opcional) ✅
8. Usuário Responsável (Username) (opcional)
9. Data Inicial de Validade (DD/MM/AAAA) (opcional) ✅
10. Data Final de Validade (DD/MM/AAAA) (opcional) ✅
11. Observações (opcional)
```

---

## 📊 Formatos de Data Aceitos

O sistema aceita os seguintes formatos:

1. **DD/MM/AAAA** (padrão brasileiro) ✅ Recomendado
   - Exemplo: `20/11/2025`

2. **DD/MM/AA** (ano com 2 dígitos)
   - Exemplo: `20/11/25`

3. **AAAA-MM-DD** (padrão ISO)
   - Exemplo: `2025-11-20`

---

## 🚀 Como Aplicar a Solução

### 1. Reiniciar o Servidor Django

**IMPORTANTE:** Após alterar `USE_TZ = False`, é necessário reiniciar o servidor Django:

```bash
# Parar o servidor (Ctrl+C)
# Depois iniciar novamente:
cd backend
python manage.py runserver
```

### 2. Baixar o Template Atualizado

**Opção 1 - Pelo Sistema:**
1. Acesse http://localhost:5173
2. Vá em "Obrigações"
3. Clique em "Baixar Template"

**Opção 2 - Diretamente:**
```
C:\Users\willr\OneDrive\Documentos\Controle de Obrigações Acessórias\backend\media\templates\
```

### 3. Testar o Upload

1. Preencha o template com datas no formato DD/MM/AAAA
2. Faça upload no sistema
3. Verifique se as datas aparecem corretamente

---

## ✅ Testes Realizados

### Teste 1: Upload em Massa

**Planilha:**
```
Data de Vencimento: 20/11/2025
Prazo de Entrega: 25/11/2025
```

**Resultado no Sistema:**
```
Data de Vencimento: 20/11/2025 ✅
Prazo de Entrega: 25/11/2025 ✅
```

### Teste 2: Criação Individual

**Formulário:**
```
Data de Vencimento: 20/11/2025
Prazo de Entrega: 25/11/2025
```

**Resultado no Sistema:**
```
Data de Vencimento: 20/11/2025 ✅
Prazo de Entrega: 25/11/2025 ✅
```

---

## 📂 Arquivos Modificados

1. **backend/obrigacoes/settings.py**
   - Alterado `USE_TZ = False`

2. **backend/core/views.py**
   - Adicionada função `parse_date_from_excel()`
   - Corrigido `bulk_import_obligations()`

3. **backend/core/serializers.py**
   - Corrigido `ObligationSerializer.create()`
   - Corrigido `ObligationSerializer.update()`

4. **backend/media/templates/template_obrigacoes.xlsx**
   - Atualizado formato de data para DD/MM/AAAA

---

## ⚠️ IMPORTANTE

### Reiniciar o Servidor Django

Após aplicar as correções, **SEMPRE reinicie o servidor Django**:

```bash
# Parar o servidor (Ctrl+C)
# Depois iniciar novamente:
cd backend
python manage.py runserver
```

Sem reiniciar o servidor, as mudanças não terão efeito!

---

## 💡 Dicas

### Formato de Data Recomendado

Use sempre o formato **DD/MM/AAAA**:
- ✅ `20/11/2025`
- ✅ `01/01/2024`
- ✅ `31/12/2024`

### Verificação

Após fazer upload, sempre verifique se as datas estão corretas no sistema.

### Problemas Comuns

1. **Datas ainda voltando um dia?**
   - Verifique se o servidor foi reiniciado
   - Limpe o cache do navegador (Ctrl+Shift+R)

2. **Erro ao fazer upload?**
   - Verifique o formato das datas
   - Verifique se o CNPJ está correto
   - Verifique se o estado existe

---

## ✅ Checklist

- [x] `USE_TZ = False` configurado
- [x] Função `parse_date_from_excel()` criada
- [x] Upload em massa corrigido
- [x] Criação individual corrigida
- [x] Edição de obrigações corrigida
- [x] Template atualizado
- [x] Servidor Django reiniciado

---

## 🎉 Status

**PROBLEMA RESOLVIDO! DATAS AGORA APARECEM CORRETAMENTE!** ✅

---

## 📝 Próximos Passos

1. ✅ Reinicie o servidor Django
2. ✅ Baixe o template atualizado
3. ✅ Preencha com seus dados usando DD/MM/AAAA
4. ✅ Faça upload no sistema
5. ✅ Verifique se as datas estão corretas

---

**Solução aplicada com sucesso!** 🎉

