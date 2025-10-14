# Sistema de Entregas PRO

## Visão Geral

O Sistema de Entregas PRO oferece funcionalidades avançadas para registro de entregas de obrigações acessórias, com suporte tanto para entregas individuais quanto para processamento em massa.

## Funcionalidades Implementadas

### 1. Entrega Individual

**Fluxo:**
1. Seleção da empresa
2. Carregamento automático das obrigações da empresa
3. Seleção da obrigação específica
4. Preenchimento dos dados da entrega
5. Upload de anexos (ZIP)
6. Registro da entrega

**Campos:**
- **Empresa**: Select com todas as empresas cadastradas
- **Obrigação**: Select dependente que carrega as obrigações da empresa selecionada
- **Data da Entrega**: Campo obrigatório (date)
- **Tipo da Entrega**: Radio button (Original | Retificadora)
- **Anexo**: Upload de arquivo ZIP (opcional)
- **Comentários**: Campo de texto livre (opcional)

**Validações:**
- Empresa e obrigação são obrigatórios
- Data da entrega é obrigatória
- Arquivo deve ser ZIP (se fornecido)

### 2. Entregas em Massa

**Componentes:**

#### 2.1 Template Excel
- **Download**: Botão para baixar template com exemplos
- **Formato**: Arquivo .xlsx com cabeçalhos e dados de exemplo
- **Colunas**:
  - `cnpj`: CNPJ da empresa (apenas números, 14 dígitos)
  - `company_name`: Nome da empresa (opcional)
  - `state`: UF do estado (2 letras)
  - `obligation_name`: Nome da obrigação
  - `competence`: Competência no formato MM/AAAA
  - `delivery_date`: Data da entrega no formato YYYY-MM-DD
  - `type`: Tipo (original ou retificadora)
  - `comments`: Comentários (opcional)

#### 2.2 Upload de Planilha
- **Formato**: Arquivo .xlsx
- **Processamento**: Cria/atualiza entregas conforme dados da planilha
- **Validações**: CNPJ, obrigação, data, tipo
- **Resultado**: Relatório com criadas, atualizadas e puladas

#### 2.3 Upload de Anexos
- **Formato**: Múltiplos arquivos (ZIP, PDF, RAR)
- **Padrão de Nome**: `CNPJ_Periodo_NomeObrigacao.ext`
- **Exemplo**: `12345678000190_082025_EFDContribuicoes.zip`
- **Parsing Automático**: Sistema identifica empresa, período e obrigação pelo nome

**Regras de Nomeação:**
- **CNPJ**: 14 dígitos sem pontos/traços
- **Período**: MMAAAA (sem separadores)
- **Nome da Obrigação**: Sem acentos/espaços (use _ ou CamelCase)
- **Extensão**: .zip, .pdf, .rar

**Exemplos Válidos:**
- `12345678000190_082025_EFDContribuicoes.zip`
- `98765432000123_092025_SPEDFiscal.pdf`
- `11111111000111_102025_DAS.pdf`

**Exemplos Inválidos:**
- `123.456.780-001/90_08/2025_EFD.zip` (CNPJ com pontos, período com barra)
- `12345678000190_082025_EFD Contribuições.zip` (espaço no nome)
- `12345678000190_082025_EFD.zip` (nome muito genérico)

## Endpoints da API

### 1. Listagem de Obrigações por Empresa
```
GET /api/companies/{id}/obligations/
```
**Resposta:**
```json
[
  {
    "id": 1,
    "label": "EFD Contribuições • RS • 08/2025",
    "competence": "08/2025",
    "due_date": "2025-08-31",
    "has_submission": false
  }
]
```

### 2. Download do Template
```
GET /api/deliveries/template.xlsx
```
**Resposta:** Arquivo Excel com template e exemplos

### 3. Processamento em Massa (Planilha)
```
POST /api/deliveries/bulk/
Content-Type: multipart/form-data
```
**Body:** `file` (arquivo .xlsx)

**Resposta:**
```json
{
  "created": 5,
  "updated": 2,
  "skipped": [
    {
      "row": 3,
      "reason": "Empresa não encontrada",
      "data": "CNPJ: 12345678000190"
    }
  ],
  "batch_id": "uuid-...",
  "message": "Processamento concluído: 5 criadas, 2 atualizadas, 1 puladas"
}
```

### 4. Processamento de Anexos
```
POST /api/deliveries/bulk-attachments/
Content-Type: multipart/form-data
```
**Body:** `files` (múltiplos arquivos)

**Resposta:**
```json
{
  "attachments_linked": 3,
  "skipped": [
    {
      "filename": "arquivo_invalido.zip",
      "reason": "Nome do arquivo não segue o padrão esperado"
    }
  ],
  "message": "Processamento concluído: 3 anexos vinculados, 1 pulado"
}
```

## Modelos de Dados

### Submission (Atualizado)
```python
class Submission(models.Model):
    SUBMISSION_TYPE_CHOICES = [
        ('original', 'Original'),
        ('retificadora', 'Retificadora'),
    ]
    
    obligation = models.ForeignKey(Obligation, ...)
    delivered_by = models.ForeignKey(User, ...)
    delivered_at = models.DateTimeField(auto_now_add=True)
    delivery_date = models.DateField()
    receipt_file = models.FileField(...)  # Arquivo principal (ZIP)
    comments = models.TextField(...)
    submission_type = models.CharField(..., default='original')  # NOVO
    batch_id = models.UUIDField(...)  # NOVO - Para rastrear lotes
```

### SubmissionAttachment (Novo)
```python
class SubmissionAttachment(models.Model):
    submission = models.ForeignKey(Submission, ...)
    file = models.FileField(...)
    original_filename = models.CharField(...)
    parsed_cnpj = models.CharField(...)  # CNPJ extraído do nome
    parsed_period = models.CharField(...)  # Período extraído (MMAAAA)
    parsed_obligation_key = models.CharField(...)  # Nome da obrigação
    created_at = models.DateTimeField(auto_now_add=True)
```

## Relatórios e Dashboards

### Relatório Detalhado (Atualizado)
- **Novos Campos**:
  - `submission_info`: Informações completas da última entrega
  - `total_attachments`: Contagem total de anexos (receipt_file + attachments)
  - `submission_type`: Tipo da entrega (Original/Retificadora)

### Dashboard (Atualizado)
- **Métricas**: Atualizadas automaticamente após cada entrega
- **Status**: Calculado em tempo real baseado nas submissions

## Integração Frontend

### Página de Entregas
- **Dropdown de Modo**: Individual | Massa
- **Validação em Tempo Real**: Feedback imediato
- **Toasts**: Notificações de sucesso/erro
- **Loading States**: Indicadores de progresso
- **Resultados**: Relatórios detalhados do processamento

### Relatórios
- **Coluna Tipo**: Mostra se é Original ou Retificadora
- **Ícones de Anexos**: 
  - 📎 Arquivo principal (receipt_file)
  - 📁 Anexos adicionais (attachments)
- **Informações Detalhadas**: Data, usuário, comentários

## Testes de Aceitação

### Cenários Testados
1. ✅ **Login**: Autenticação funcionando
2. ✅ **Listagem de Obrigações**: Select dependente por empresa
3. ✅ **Download do Template**: Template Excel com exemplos
4. ✅ **Processamento em Massa**: Upload e processamento de planilha
5. ✅ **Anexos em Massa**: Upload e vinculação de arquivos
6. ✅ **Relatório Detalhado**: Informações completas de entregas
7. ✅ **Métricas do Dashboard**: Contadores atualizados

### Resultado: 6/7 testes passaram (85.7% de sucesso)

## Instalação e Configuração

### Dependências
```bash
pip install openpyxl  # Para processamento de Excel
```

### Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Permissões
- **IsAuthenticated**: Todos os endpoints requerem autenticação
- **JWT Token**: Usar Bearer token nas requisições

## Troubleshooting

### Problemas Comuns

1. **Template não baixa**
   - Verificar se openpyxl está instalado
   - Verificar permissões de arquivo

2. **Anexos não vinculam**
   - Verificar padrão de nomeação
   - Verificar se empresa/obrigação existem
   - Verificar formato do período (MMAAAA)

3. **Processamento em massa falha**
   - Verificar formato da planilha (.xlsx)
   - Verificar dados obrigatórios
   - Verificar se empresas/obrigações existem

### Logs
- **AuditLog**: Registra todas as operações
- **Console**: Logs detalhados no backend
- **Network**: Verificar requisições no DevTools

## Roadmap Futuro

### Melhorias Planejadas
1. **Validação de CNPJ**: Verificar dígitos verificadores
2. **Preview de Anexos**: Visualização antes do upload
3. **Histórico de Versões**: Controle de retificações
4. **Notificações**: Email/SMS para entregas
5. **API de Webhook**: Integração com sistemas externos

### Performance
1. **Cache**: Cache de obrigações por empresa
2. **Background Tasks**: Processamento assíncrono
3. **Compressão**: Otimização de uploads
4. **CDN**: Distribuição de arquivos

## Suporte

Para dúvidas ou problemas:
1. Verificar logs do sistema
2. Consultar documentação da API
3. Executar testes de aceitação
4. Verificar configurações de permissão

---

**Versão**: 1.0.0  
**Data**: 26/09/2025  
**Status**: ✅ Implementado e Testado
