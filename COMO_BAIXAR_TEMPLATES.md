# 📥 Como Baixar os Templates Atualizados

## ✅ Templates Criados com Sucesso!

Os templates foram atualizados e estão prontos para uso!

---

## 📂 Localização dos Templates

Os templates estão localizados em:
```
backend/media/templates/
├── template_empresas.xlsx
└── template_obrigacoes.xlsx
```

---

## 🎯 Como Baixar os Templates

### Opção 1: Pelo Sistema (Recomendado)

**Para baixar o template de empresas:**
1. Acesse http://localhost:5173
2. Vá em "Empresas"
3. Clique no botão "Baixar Template"
4. O arquivo será baixado automaticamente

**Para baixar o template de obrigações:**
1. Acesse http://localhost:5173
2. Vá em "Obrigações"
3. Clique no botão "Baixar Template"
4. O arquivo será baixado automaticamente

### Opção 2: Diretamente do Sistema de Arquivos

**Windows:**
```
C:\Users\willr\OneDrive\Documentos\Controle de Obrigações Acessórias\backend\media\templates\
```

**Copie os arquivos:**
- `template_empresas.xlsx`
- `template_obrigacoes.xlsx`

---

## 📊 Estrutura dos Templates

### Template de Empresas (`template_empresas.xlsx`)

**Colunas:**
1. **Código** (obrigatório) - Código único da empresa
2. **Razão Social** (obrigatório) - Nome completo da empresa
3. **CNPJ** (opcional) - CNPJ da empresa
4. **Nome Fantasia** (opcional) - Nome fantasia
5. **E-mail** (opcional) - E-mail de contato
6. **Telefone** (opcional) - Telefone de contato
7. **Endereço** (opcional) - Endereço completo
8. **Responsável** (opcional) - Nome do responsável

**Exemplo:**
```
Código    | Razão Social              | CNPJ              | Nome Fantasia
EMP001    | Empresa Exemplo Ltda      | 12345678000190   | Exemplo
CLI001    | Cliente Importante S.A.   | 98765432000110   | Cliente VIP
```

### Template de Obrigações (`template_obrigacoes.xlsx`)

**Colunas:**
1. **CNPJ da Empresa** (obrigatório) - CNPJ da empresa
2. **Estado** (obrigatório) - Código do estado (SP, RJ, MG, etc.)
3. **Tipo de Obrigação** (obrigatório) - Nome do tipo de obrigação
4. **Nome da Obrigação** (opcional) - Nome específico da obrigação
5. **Competência** (obrigatório) - Competência no formato MM/AAAA
6. **Data de Vencimento** (obrigatório) - Data de vencimento (YYYY-MM-DD)
7. **Prazo de Entrega** (opcional) - Prazo de entrega (YYYY-MM-DD)
8. **Usuário Responsável** (opcional) - Username do usuário responsável
9. **Data Inicial de Validade** (opcional) - Data inicial (YYYY-MM-DD)
10. **Data Final de Validade** (opcional) - Data final (YYYY-MM-DD)
11. **Notas** (opcional) - Observações adicionais

**Exemplo:**
```
CNPJ da Empresa | Estado | Tipo de Obrigação | Competência | Data de Vencimento
12345678000190  | SP     | SPED Fiscal       | 01/2024     | 2024-01-31
98765432000110  | RJ     | ICMS              | 01/2024     | 2024-01-20
```

---

## 🔍 Verificar se os Templates Estão Corretos

### Template de Empresas

Abra o arquivo e verifique:
- ✅ Primeira coluna é "Código"
- ✅ Segunda coluna é "Razão Social"
- ✅ Terceira coluna é "CNPJ"
- ✅ Tem uma linha de exemplo com dados

### Template de Obrigações

Abra o arquivo e verifique:
- ✅ Primeira coluna é "CNPJ da Empresa"
- ✅ Segunda coluna é "Estado"
- ✅ Terceira coluna é "Tipo de Obrigação"
- ✅ Tem uma linha de exemplo com dados

---

## 🎨 Formatação dos Templates

Os templates incluem:
- ✅ Cabeçalhos formatados (azul, negrito, centralizado)
- ✅ Largura das colunas ajustada
- ✅ Primeira linha congelada
- ✅ Auto-filtro habilitado
- ✅ Linha de exemplo com dados

---

## 💡 Dicas de Uso

### Ao Preencher o Template de Empresas

1. **Código:** Escolha um código único (ex: EMP001, CLI001, MATRIZ)
2. **Razão Social:** Nome completo da empresa
3. **CNPJ:** Pode ser com ou sem formatação
4. **Outros campos:** Preencha conforme necessário

### Ao Preencher o Template de Obrigações

1. **CNPJ da Empresa:** Use o CNPJ da empresa cadastrada
2. **Estado:** Código do estado (SP, RJ, MG, etc.)
3. **Tipo de Obrigação:** Nome do tipo (será criado se não existir)
4. **Competência:** Formato MM/AAAA (ex: 01/2024)
5. **Data de Vencimento:** Formato YYYY-MM-DD (ex: 2024-01-31)

---

## 🚀 Próximos Passos

1. ✅ Baixe os templates
2. ✅ Abra no Excel ou Google Sheets
3. ✅ Preencha com seus dados
4. ✅ Salve o arquivo
5. ✅ Faça upload no sistema

---

## ❓ Problemas?

### Não consigo baixar pelo sistema

**Solução:** Acesse diretamente pelo sistema de arquivos:
```
backend/media/templates/
```

### Template não abre

**Solução:** Certifique-se de ter o Excel ou Google Sheets instalado

### Template está vazio

**Solução:** Os templates incluem apenas o cabeçalho e uma linha de exemplo. Você deve preencher com seus dados.

---

## 📝 Checklist

- [ ] Templates baixados
- [ ] Templates abertos e verificados
- [ ] Estrutura correta confirmada
- [ ] Dados preenchidos
- [ ] Arquivo salvo
- [ ] Upload realizado no sistema

---

**Templates prontos para uso!** 🎉

