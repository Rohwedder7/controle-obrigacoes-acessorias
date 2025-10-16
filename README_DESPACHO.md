# 📬 Sistema de Despacho - Documentação

## 🎯 Visão Geral

O Sistema de Despacho permite gerenciar atividades de notificação fiscal, fiscalização e despacho decisório com controle de progresso baseado em subatividades.

## 🚀 Como Acessar

1. **Página Principal**: Acesse `/despacho` no sistema
2. **Menu Lateral**: Clique em "Despacho" 📬 no menu lateral
3. **Permissões**: Disponível para todos os usuários autenticados

## 📋 Funcionalidades

### 1. **Criar Atividade**
- Clique em "Criar Nova Atividade" (dropdown expandido)
- Preencha os campos obrigatórios:
  - **Empresa**: Selecione a empresa responsável
  - **Categoria**: Notificação Fiscal, Fiscalização ou Despacho Decisório
  - **Data Inicial**: Data de início do prazo
  - **Data Final**: Data limite para conclusão
- Campos opcionais:
  - **Título**: Nome personalizado da atividade
  - **Responsável**: Usuário responsável pela execução

### 2. **Gerenciar Subatividades**
- Clique no botão "+" ao lado de cada atividade
- Adicione subatividades com:
  - **Nome**: Descrição da tarefa
  - **Status**: Não Iniciado, Em Andamento ou Concluído
- Edite ou remova subatividades conforme necessário

### 3. **Acompanhar Progresso**
- **Barra de Progresso**: Mostra percentual de conclusão
- **Status Automático**: 
  - Não Iniciado (0% concluído)
  - Em Andamento (parcialmente concluído)
  - Concluído (100% concluído)
- **Cálculo**: Baseado na proporção de subatividades concluídas

### 4. **Filtrar e Buscar**
- **Filtros Disponíveis**:
  - Empresa
  - Categoria
  - Responsável
  - Status
- **Busca por Texto**: Título, categoria ou empresa
- **Aplicação em Tempo Real**: Resultados atualizados automaticamente

## 🔧 Endpoints da API

### **Despachos**
```
GET    /api/dispatches/                    # Listar despachos
POST   /api/dispatches/                    # Criar despacho
GET    /api/dispatches/{id}/               # Detalhar despacho
PATCH  /api/dispatches/{id}/               # Atualizar despacho
DELETE /api/dispatches/{id}/               # Excluir despacho
GET    /api/dispatches/{id}/progress/      # Ver progresso
```

### **Subatividades**
```
GET    /api/dispatches/{id}/subtasks/      # Listar subatividades
POST   /api/dispatches/{id}/subtasks/      # Criar subatividade
PATCH  /api/dispatches/{id}/subtasks/{sid}/ # Atualizar subatividade
DELETE /api/dispatches/{id}/subtasks/{sid}/ # Excluir subatividade
```

### **Notificações**
```
POST   /api/dispatches/notifications/run/  # Executar notificações manuais
POST   /api/dispatches/progress/recalculate/ # Recalcular progresso
```

## 🔔 Notificações Semanais

### **Como Funciona**
- Verifica automaticamente despachos com prazo próximo (7 dias)
- Identifica despachos em atraso
- Cria notificações para responsáveis e criadores
- Integra com o sistema de notificações existente

### **Agendamento (Cron)**
```bash
# Executar toda segunda-feira às 9h
0 9 * * 1 cd /caminho/para/projeto && python manage.py send_dispatch_weekly_notifications
```

### **Execução Manual**
```bash
# Via command line
python manage.py send_dispatch_weekly_notifications

# Via API (Admin apenas)
POST /api/dispatches/notifications/run/
```

## 🔐 Segurança

### **Permissões**
- **Admin**: Acesso total a todos os despachos
- **Usuário**: Pode ver/editar apenas despachos que criou ou é responsável
- **IDOR Prevention**: Validação de propriedade em todas as operações

### **Validações**
- Datas: Data inicial não pode ser posterior à final
- Categorias: Apenas valores válidos do enum
- Tamanhos: Limites de caracteres respeitados
- Status: Validação de valores permitidos

### **Auditoria**
- Todas as ações são registradas no AuditLog
- Rastreamento de criação, edição e exclusão
- Identificação do usuário responsável

## 📁 Arquivos Criados/Modificados

### **Backend**
```
backend/core/models.py                     # Modelos Dispatch e DispatchSubtask
backend/core/serializers.py                # Serializers para API
backend/core/views_dispatches.py           # Views e ViewSets
backend/core/services_dispatch.py          # Serviço de notificações
backend/core/urls.py                       # URLs dos endpoints
backend/core/management/commands/
  └── send_dispatch_weekly_notifications.py # Command para notificações
```

### **Frontend**
```
frontend/src/pages/Dispatches.jsx          # Página principal
frontend/src/api.js                        # Funções da API
frontend/src/main.jsx                      # Rotas
frontend/src/components/Sidebar.jsx        # Menu lateral
```

### **Documentação**
```
TESTE_ACEITACAO_DESPACHO.md               # Testes de aceitação
README_DESPACHO.md                         # Esta documentação
```

## 🧪 Como Testar

### **Teste Básico**
1. Acesse `/despacho`
2. Crie uma atividade de "Fiscalização"
3. Adicione 3 subatividades
4. Marque uma como "Concluído"
5. Verifique: Progresso = 33%, Status = "Em Andamento"

### **Teste de Notificações**
1. Crie despacho com prazo para amanhã
2. Execute: `python manage.py send_dispatch_weekly_notifications`
3. Verifique se notificação foi criada

### **Teste de Permissões**
1. Faça login como usuário comum
2. Tente acessar despacho de outro usuário
3. Verifique se acesso é negado

## 🚨 Troubleshooting

### **Problema: Página não carrega**
- Verifique se as migrações foram aplicadas
- Confirme se o servidor backend está rodando
- Verifique logs do navegador para erros JavaScript

### **Problema: Notificações não funcionam**
- Verifique se o comando está no PATH
- Confirme permissões de execução
- Verifique logs do Django para erros

### **Problema: Progresso não atualiza**
- Execute: `POST /api/dispatches/progress/recalculate/`
- Verifique se subatividades estão sendo salvas corretamente
- Confirme se o método `update_progress()` está sendo chamado

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte este README
2. Verifique os logs do sistema
3. Execute os testes de aceitação
4. Entre em contato com a equipe de desenvolvimento

---

**✅ Sistema implementado com sucesso e pronto para uso!** 🎉
