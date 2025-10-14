# Recorrências de Obrigações

## Visão Geral

O sistema permite gerar obrigações recorrentes automaticamente, sempre considerando a última obrigação existente como base para calcular as próximas competências e datas. Esta funcionalidade permite múltiplas gerações sem travas, expandindo continuamente a série de obrigações.

## Conceito de Base ("Última Obrigação")

O sistema identifica automaticamente a **última obrigação existente** para uma combinação específica de:
- Empresa
- Estado  
- Tipo de Obrigação

A "última obrigação" é determinada pela **data de vencimento mais distante** (`due_date`), garantindo que sempre se parta da obrigação mais recente no tempo.

## Cálculo de +1 Mês com Clamp

### Competência
- Incrementa +1 mês à competência base (mm/aaaa → próximo mm/aaaa)
- Trata mudança de ano automaticamente (12 → 01/ano+1)
- Mantém zero padding do mês (01, 02, ..., 12)

### Data de Vencimento
- Preserva o "dia" da última `due_date` ao somar +1 mês
- **Clamp automático**: Se o mês seguinte não tiver esse dia (ex.: 31/01 → 28/02), ajusta para o último dia do mês
- Exemplo: 31/01/2024 → 29/02/2024 (ano bissexto) → 31/03/2024

### Prazo de Entrega
- Aplica a mesma lógica de +1 mês com clamp
- Mantém a diferença em dias entre vencimento e prazo de entrega

## Endpoints da API

### Preview
```
POST /api/obligations/recurrence/preview/
```

**Body:**
```json
{
  "company_id": 1,
  "state_code": "RS",
  "obligation_type_id": 5,
  "count": 3,
  "start_competence": "01/2025",
  "start_due_date": "2025-01-25",
  "start_delivery_deadline": "2025-01-30"
}
```

**Resposta:**
```json
{
  "base_used": {
    "id": 123,
    "competence": "01/2025",
    "due_date": "2025-01-25",
    "type": "existing"
  },
  "proposed": [
    {
      "competence": "02/2025",
      "due_date": "2025-02-25",
      "delivery_deadline": "2025-02-30",
      "would_conflict": false,
      "conflict_reason": null
    }
  ],
  "count_requested": 3
}
```

### Generate
```
POST /api/obligations/recurrence/generate/
```

**Body:** (mesmo do preview)

**Resposta:**
```json
{
  "created": [124, 125, 126],
  "skipped": [
    {
      "competence": "03/2025",
      "reason": "Já existe obrigação para esta competência"
    }
  ],
  "base_used": {
    "id": 123,
    "competence": "01/2025",
    "due_date": "2025-01-25",
    "type": "existing"
  },
  "last_created": {
    "id": 126,
    "competence": "04/2025",
    "due_date": "2025-04-25"
  },
  "summary": {
    "created_count": 3,
    "skipped_count": 1,
    "total_requested": 4
  }
}
```

## Interface do Usuário

### Modal de Geração
- **Localização**: Página de Obrigações → Botão "Gerar Recorrências"
- **Campos obrigatórios**: Empresa, Estado, Tipo de Obrigação
- **Campos opcionais**: Quantidade, Parâmetros iniciais (apenas se não houver base)

### Funcionalidades
1. **Preview**: Visualiza as próximas obrigações que seriam criadas
2. **Generate**: Cria as obrigações e mostra relatório de resultado
3. **Feedback visual**: Indica conflitos e sucessos com cores

## Reexecução Quantas Vezes Quiser

O sistema **sempre expande a série** a partir da última obrigação existente:

1. **Primeira execução**: Cria obrigações baseadas em parâmetros iniciais
2. **Execuções subsequentes**: Sempre considera a última obrigação criada
3. **Múltiplas execuções**: Cada nova execução continua da data mais distante

### Exemplo Prático
```
Execução 1: count=3 → Cria 01/2025, 02/2025, 03/2025
Execução 2: count=2 → Cria 04/2025, 05/2025 (continua de 03/2025)
Execução 3: count=2 → Cria 06/2025, 07/2025 (continua de 05/2025)
```

## Campos Opcionais de "Início"

Quando **não existe base** (primeira obrigação da combinação), são obrigatórios:
- `start_competence`: Competência inicial (mm/aaaa)
- `start_due_date`: Data de vencimento inicial
- `start_delivery_deadline`: Prazo de entrega inicial (opcional)

## Mensagens de Conflito e Relatório

### Conflitos
- **Motivo**: Violação de `unique_together` (empresa, estado, tipo, competência)
- **Comportamento**: Pula a obrigação conflitante e continua
- **Relatório**: Lista obrigações ignoradas com motivo

### Relatório de Resultado
- **Criadas**: IDs das obrigações criadas com sucesso
- **Ignoradas**: Lista de competências ignoradas com motivo
- **Base usada**: Informações da obrigação usada como base
- **Última criada**: Informações da última obrigação criada

## Robustez e Transações

- **Transação atômica**: Cada chamada é uma transação independente
- **Captura de conflitos**: Violações de `unique_together` são capturadas e reportadas
- **Sem rollback total**: Conflitos não impedem criação de outras obrigações
- **Select related**: Otimização de consultas com relacionamentos
- **Timezone**: Mantém America/Sao_Paulo

## AuditLog

Cada geração é registrada no AuditLog com:
- **Evento**: `generate_recurrences`
- **Payload**: Dados enviados na requisição
- **Resultado**: Resumo da operação (criadas, ignoradas, base usada)

## Casos de Borda Testados

✅ **Clamp de dia**: 31/01 → 28/02 (ou 29/02 em ano bissexto)  
✅ **Mudança de ano**: 12/2024 → 01/2025  
✅ **Múltiplas gerações**: Sempre continua da última obrigação  
✅ **Conflitos**: Pula duplicatas e continua  
✅ **Base inexistente**: Usa parâmetros iniciais  
✅ **Base existente**: Usa última obrigação automaticamente  

## Arquivos Implementados

### Backend
- `backend/core/views_recurrence.py` - Lógica de recorrência
- `backend/core/urls.py` - Novas rotas adicionadas

### Frontend  
- `frontend/src/pages/Obligations.jsx` - Modal de recorrência adicionado

### Sem Alterações
- ✅ Estrutura existente preservada
- ✅ CRUDs existentes não alterados
- ✅ Relatórios existentes não alterados
- ✅ Dashboard não alterado
- ✅ Autenticação não alterada
