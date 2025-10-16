# 🚀 Guia Rápido - Campo Código nas Empresas

## ⚡ Início Rápido (5 minutos)

### Passo 1: Aplicar a Migration

```bash
cd backend
python manage.py migrate core
```

### Passo 2: Atualizar Empresas Existentes

```bash
python add_codes_to_existing_companies.py
```

### Passo 3: Reiniciar o Servidor

```bash
# Backend
python manage.py runserver

# Frontend (em outro terminal)
cd frontend
npm run dev
```

### Passo 4: Testar

1. Acesse http://localhost:5173
2. Vá em "Empresas"
3. Verifique se os códigos aparecem nos cards
4. Tente cadastrar uma nova empresa (código obrigatório)

## ✅ Pronto!

O sistema está atualizado com o campo código nas empresas.

## 📖 O Que Mudou?

### Antes
```
Empresa Exemplo Ltda
CNPJ: 12.345.678/0001-90
```

### Agora
```
[EMP001] Empresa Exemplo Ltda
CNPJ: 12.345.678/0001-90
```

## 🎯 Principais Benefícios

1. **Identificação Única:** Cada empresa tem um código único
2. **Fácil Busca:** Encontre empresas rapidamente pelo código
3. **Organização:** Códigos padronizados facilitam a gestão
4. **Rastreabilidade:** Use códigos em relatórios e documentos

## 📝 Como Usar o Código

### Cadastro Individual
1. Clique em "Nova Empresa"
2. Preencha o **Código** (ex: EMP001, CLI001, FOR001)
3. Preencha os demais campos
4. Salve

### Cadastro em Massa
1. Baixe o template atualizado
2. Preencha a coluna "Código" (primeira coluna)
3. Faça upload
4. Pronto!

## 🔍 Onde o Código Aparece?

- ✅ Cards de empresas
- ✅ Dropdowns de seleção
- ✅ Relatórios
- ✅ Dashboard
- ✅ Aprovações
- ✅ Entregas

## 💡 Dicas

### Criando Códigos
- Use prefixos: EMP (Empresa), CLI (Cliente), FOR (Fornecedor)
- Use números: EMP001, EMP002, EMP003
- Evite caracteres especiais
- Máximo 50 caracteres

### Exemplos de Códigos
- `EMP001` - Empresa 1
- `CLI001` - Cliente 1
- `FOR001` - Fornecedor 1
- `MATRIZ` - Matriz
- `FILIAL_SP` - Filial São Paulo

## ⚠️ Importante

- O código **não pode ser alterado** após a criação
- O código deve ser **único** para cada empresa
- O código é **obrigatório** em novos cadastros

## 🆘 Problemas?

### "Campo código não pode ser nulo"
Execute o script de atualização:
```bash
python backend/add_codes_to_existing_companies.py
```

### "Código já existe"
Escolha outro código único para a empresa.

### Empresas não aparecem
Limpe o cache do navegador (Ctrl+Shift+Del) e recarregue.

## 📚 Documentação Completa

Para mais detalhes, consulte:
- `MIGRACAO_CODIGO_EMPRESA.md` - Instruções detalhadas de migração
- `RESUMO_MELHORIA_CODIGO_EMPRESA.md` - Resumo técnico completo

---

**Desenvolvido com ❤️ para o Sistema de Controle de Obrigações Acessórias**

