# 📊 Relatórios Detalhados

## Visão Geral

O sistema de relatórios detalhados permite gerar relatórios completos e exportações CSV/XLSX com filtros avançados, visualização rica e autenticação JWT.

## 🚀 Funcionalidades

### ✅ Relatório Detalhado
- **Endpoint**: `GET /api/reports/detailed/`
- **Autenticação**: JWT Bearer Token obrigatório
- **Filtros**: Empresa, tipo de obrigação, nome, período, status
- **Dados**: Totais, agregações, linhas detalhadas

### ✅ Exportações Autenticadas
- **CSV**: `GET /api/reports/export.csv`
- **XLSX**: `GET /api/reports/export.xlsx`
- **Autenticação**: JWT Bearer Token obrigatório
- **Filtros**: Mesmos filtros do relatório detalhado

### ✅ Interface Rica
- **Filtros avançados**: Multiselect, texto com debounce, período
- **Cards de totais**: Obrigações, entregues, pendentes, atrasadas
- **Tabela detalhada**: Sticky header, ordenação, status badges
- **Exportações**: Download autenticado com filtros aplicados

## 🔧 Filtros Disponíveis

### Query Parameters

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `company_id` | int[] | IDs das empresas (repetível) | `company_id=1&company_id=2` |
| `obligation_name` | string | Nome da obrigação (icontains) | `obligation_name=SPED` |
| `obligation_type_id` | int[] | IDs dos tipos (repetível) | `obligation_type_id=5&obligation_type_id=10` |
| `competence_start` | string | Competência início (MM/AAAA) | `competence_start=01/2024` |
| `competence_end` | string | Competência fim (MM/AAAA) | `competence_end=12/2024` |
| `due_start` | string | Vencimento início (YYYY-MM-DD) | `due_start=2024-01-01` |
| `due_end` | string | Vencimento fim (YYYY-MM-DD) | `due_end=2024-12-31` |
| `status` | string | Status da obrigação | `status=pendente` |

### Status Disponíveis
- `pendente`: Obrigação não entregue e não vencida
- `atrasado`: Obrigação não entregue e vencida
- `entregue`: Obrigação com submission

## 📋 Estrutura da Resposta

### Relatório Detalhado

```json
{
  "filters_applied": {
    "company_ids": ["1", "2"],
    "obligation_name": "SPED",
    "obligation_type_ids": ["5"],
    "competence_start": "01/2024",
    "competence_end": "12/2024",
    "due_start": "",
    "due_end": "",
    "status": "pendente"
  },
  "totals": {
    "obligations": 150,
    "submissions": 45,
    "pending": 60,
    "late": 45,
    "delivered": 45
  },
  "by_company": [
    {
      "company": "Empresa A",
      "count": 50,
      "pending": 20,
      "late": 15,
      "delivered": 15
    }
  ],
  "by_state": [
    {
      "state": "SP",
      "count": 80,
      "pending": 30,
      "late": 25,
      "delivered": 25
    }
  ],
  "by_type": [
    {
      "type": "SPED FISCAL",
      "count": 100,
      "pending": 40,
      "late": 30,
      "delivered": 30
    }
  ],
  "rows": [
    {
      "company": "Empresa A",
      "cnpj": "12345678000199",
      "state": "SP",
      "obligation_type": "SPED FISCAL",
      "obligation_name": "SPED FISCAL",
      "competence": "10/2024",
      "due_date": "2024-11-20",
      "delivery_deadline": "2024-11-15",
      "status": "pendente",
      "delivered_at": null,
      "delivered_by": null,
      "days_late": 0,
      "notes": "Obrigação de teste",
      "attachments": 0,
      "created_by": "admin",
      "created_at": "2024-09-26T19:43:56.761710+00:00"
    }
  ]
}
```

## 🔐 Autenticação

### JWT Bearer Token

Todas as requisições devem incluir o header de autorização:

```http
Authorization: Bearer <access_token>
```

### Erro 401

Se o token estiver ausente ou inválido:

```json
{
  "detail": "Authentication credentials were not provided."
}
```

**Solução**: Fazer login novamente para obter um novo token.

## 📤 Exportações

### CSV

**Endpoint**: `GET /api/reports/export.csv`

**Headers**:
- `Authorization: Bearer <token>`
- `Content-Type: text/csv`

**Cabeçalhos**:
```
Empresa,CNPJ,Estado,Tipo de Obrigação,Nome da Obrigação,Competência,Vencimento,Prazo Entrega,Status,Entregue em,Entregue por,Dias de Atraso,Anexos,Criado por,Criado em,Notas
```

### XLSX

**Endpoint**: `GET /api/reports/export.xlsx`

**Headers**:
- `Authorization: Bearer <token>`
- `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**Abas**:
- **Obrigações**: Dados detalhados com formatação
- **Resumo**: Totais e filtros aplicados

**Recursos**:
- Cabeçalho formatado (azul, texto branco)
- Primeira linha congelada
- Auto-filter ativado
- Largura de colunas ajustada
- Formatação profissional

## 🎨 Interface Frontend

### Filtros Avançados

1. **Empresas**: Multiselect com "Todos" e "Limpar"
2. **Tipos de Obrigação**: Multiselect com "Todos" e "Limpar"
3. **Nome da Obrigação**: Campo de texto com debounce (500ms)
4. **Período de Competência**: Início e fim (MM/AAAA)
5. **Status**: Checkboxes (pendente, atrasado, entregue)

### Visualização

1. **Cards de Totais**: 4 cards com ícones e cores
2. **Botões de Exportação**: CSV e Excel com autenticação
3. **Tabela Detalhada**: Sticky header, hover, status badges
4. **Loading States**: Skeleton e spinners
5. **Error Handling**: Toasts e mensagens claras

### Download Autenticado

```javascript
// Função de download com autenticação
async function downloadReport(path, filename, filters = {}) {
  const token = localStorage.getItem('access')
  const r = await fetch(API + url, { 
    headers: { 
      'Authorization': 'Bearer ' + token 
    } 
  })
  
  if (!r.ok) {
    if (r.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.')
    }
    throw new Error(`Erro ${r.status}: ${r.statusText}`)
  }
  
  const blob = await r.blob()
  const downloadUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(downloadUrl)
}
```

## 🧪 Exemplos de Uso

### Relatório sem Filtros

```bash
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/reports/detailed/
```

### Relatório com Filtros

```bash
curl -H "Authorization: Bearer <token>" \
     "http://localhost:8000/api/reports/detailed/?company_id=1&company_id=2&obligation_name=SPED&competence_start=01/2024&competence_end=12/2024&status=pendente"
```

### Exportação CSV

```bash
curl -H "Authorization: Bearer <token>" \
     -o relatorio.csv \
     "http://localhost:8000/api/reports/export.csv?company_id=1&status=atrasado"
```

### Exportação XLSX

```bash
curl -H "Authorization: Bearer <token>" \
     -o relatorio.xlsx \
     "http://localhost:8000/api/reports/export.xlsx?competence_start=01/2024&competence_end=12/2024"
```

## 🔍 Troubleshooting

### Erro 401 nas Exportações

**Problema**: Exportações retornam 401 Unauthorized

**Causa**: Token JWT ausente ou expirado

**Solução**: 
1. Verificar se o token está sendo enviado
2. Fazer login novamente se o token expirou
3. Usar download autenticado no frontend

### Filtros Não Aplicados

**Problema**: Filtros não estão sendo aplicados corretamente

**Causa**: Formato incorreto dos parâmetros

**Solução**:
1. Verificar formato das datas (MM/AAAA para competência, YYYY-MM-DD para vencimento)
2. Usar array para múltiplos valores: `company_id=1&company_id=2`
3. Verificar se os IDs existem no banco

### Performance Lenta

**Problema**: Relatórios demoram para carregar

**Causa**: Muitos dados sem filtros

**Solução**:
1. Aplicar filtros para reduzir o dataset
2. Usar paginação para grandes volumes
3. Considerar cache para relatórios frequentes

## 📈 Melhorias Futuras

- [ ] Paginação para grandes datasets
- [ ] Cache de relatórios frequentes
- [ ] Gráficos interativos (Chart.js)
- [ ] Agendamento de relatórios
- [ ] Notificações por email
- [ ] Relatórios personalizados
- [ ] Exportação para PDF
- [ ] Filtros salvos/favoritos

## 🎯 Critério de Aceite

✅ **Relatório Completo**: Cards, gráficos e tabela com todos os dados relevantes
✅ **Filtros Funcionais**: Todos os filtros aplicados corretamente
✅ **Exportações Autenticadas**: CSV/XLSX baixam sem erro 401
✅ **Interface Rica**: Visualização bonita e útil
✅ **Performance**: Resposta rápida e responsiva
✅ **Compatibilidade**: Não quebra funcionalidades existentes
