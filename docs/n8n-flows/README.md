# Fluxos N8N para WhatsApp com Evolution API

Este diretório contém os fluxos N8N prontos para integrar o sistema PoupeJá com Evolution API para envio de notificações WhatsApp.

## 📁 Arquivos Disponíveis

### 1. `evolution-api-webhook-flow.json`
**Fluxo usando Webhook para Evolution API**
- ✅ Mais simples de configurar
- ✅ Funciona com qualquer versão da Evolution API
- ✅ Maior compatibilidade
- ⚠️ Requer configuração manual da autenticação

### 2. `evolution-api-node-flow.json`
**Fluxo usando Node Nativo Evolution API**
- ✅ Integração mais nativa
- ✅ Melhor tratamento de erros
- ✅ Configuração de credenciais centralizada
- ⚠️ Requer node Evolution API instalado no N8N

## 🚀 Como Configurar

### Pré-requisitos
1. **N8N instalado e funcionando**
2. **Evolution API configurada e conectada**
3. **Instância WhatsApp conectada na Evolution API**
4. **Webhook URL do N8N disponível**

### Passo 1: Importar o Fluxo
1. Acesse seu N8N
2. Clique em "Import from file"
3. Selecione um dos arquivos JSON
4. Clique em "Import"

### Passo 2: Configurar Credenciais (Para Node Flow)
Se usar o `evolution-api-node-flow.json`:

1. Vá em **Settings > Credentials**
2. Crie nova credencial **Evolution API**
3. Configure:
   - **API URL**: `https://sua-evolution-api.com`
   - **API Key**: `sua-api-key-evolution`
   - **Instance**: `sua-instancia`

### Passo 3: Configurar URLs e Instância
Edite os nodes "Add Evolution Config":

**Para Webhook Flow:**
```javascript
evolutionApiUrl: 'https://sua-evolution-api.com'
instanceName: 'sua-instancia'
```

**Para Node Flow:**
```javascript
evolutionInstance: 'sua-instancia'
```

### Passo 4: Configurar Autenticação (Para Webhook Flow)
Se usar o `evolution-api-webhook-flow.json`:

1. No node "Send WhatsApp Message"
2. Configure **Authentication > Generic Credential Type**
3. Crie credencial **HTTP Header Auth**:
   - **Name**: `evolutionApiCredential`
   - **Header Name**: `apikey` (ou conforme sua Evolution API)
   - **Header Value**: `sua-api-key`

### Passo 5: Ativar o Fluxo
1. Clique em **Active** para ativar o workflow
2. Copie a **Webhook URL** gerada
3. Cole no sistema PoupeJá (Admin > WhatsApp + N8N)

## 🔧 Configuração no PoupeJá

1. Acesse `/admin`
2. Vá para aba **"WhatsApp + N8N"**
3. Configure:
   - ✅ **Ativar Notificações WhatsApp**: ON
   - 🔗 **URL do Webhook N8N**: `https://seu-n8n.com/webhook/poupeja-whatsapp`
   - 📱 **Telefone para Teste**: `+5511999999999`
4. Clique em **"Salvar Configurações"**
5. Teste com **"Testar Notificação"**

## 📨 Formato dos Dados Enviados

O sistema PoupeJá envia os seguintes dados para o N8N:

### Para Compromissos
```json
{
  "type": "appointment_reminder",
  "user": {
    "phone": "+5511999999999",
    "name": "João Silva"
  },
  "appointment": {
    "title": "Consulta Médica",
    "date": "2025-01-27T14:30:00Z",
    "location": "Hospital São Paulo",
    "minutesUntil": 30
  },
  "message": "Mensagem customizada (opcional)",
  "webhookUrl": "https://seu-n8n.com/webhook/poupeja-whatsapp"
}
```

### Para Transações
```json
{
  "type": "transaction_reminder",
  "user": {
    "phone": "+5511999999999", 
    "name": "João Silva"
  },
  "transaction": {
    "title": "Conta de Luz",
    "amount": 150.50,
    "due_date": "2025-01-30T23:59:59Z",
    "description": "Conta de energia elétrica",
    "category": "Contas Fixas"
  },
  "message": "Mensagem customizada (opcional)"
}
```

## 📱 Exemplo de Mensagens Geradas

### Compromiso
```
🗓️ **Lembrete de Compromisso**

Olá, João Silva!

Você tem um compromisso agendado:
📅 **Consulta Médica**
🕐 27/01/2025 às 14:30
📍 Local: Hospital São Paulo

⏰ *Em 30 minutos*

💡 *PoupeJá - Seu assistente financeiro*
```

### Transação  
```
💰 **Lembrete Financeiro**

Olá, João Silva!

Você tem uma transação programada:
📝 **Conta de Luz**
💵 Valor: R$ 150,50
📅 Vencimento: 30/01/2025
🏷️ Categoria: Contas Fixas

💡 *PoupeJá - Seu assistente financeiro*
```

## 🐛 Troubleshooting

### ❌ Erro de Autenticação
- Verifique se a API Key da Evolution API está correta
- Confirme se a instância está ativa e conectada
- Teste a API diretamente no Postman

### ❌ Telefone Inválido  
- O fluxo normaliza automaticamente telefones brasileiros
- Formato aceito: `11999999999`, `+5511999999999`, `5511999999999`
- Verifica e adiciona DDI (55) e 9º dígito automaticamente

### ❌ Mensagem não Enviada
- Verifique logs do N8N
- Confirme se a Evolution API está respondendo
- Teste o endpoint da Evolution API diretamente

### ❌ Webhook não Recebido
- Verifique se o N8N está acessível externamente  
- Confirme se a URL do webhook está correta no PoupeJá
- Teste o webhook com ferramenta como Postman

## 📈 Monitoramento e Logs

### N8N Logs
- Acesse **Executions** no N8N para ver histórico
- Verifique erros e tempos de execução
- Use **Test Workflow** para debugar

### Evolution API Logs  
- Monitore logs da Evolution API para erros de envio
- Verifique status da instância WhatsApp
- Confirme se mensagens estão sendo entregues

### PoupeJá Logs
- Use as ferramentas de debug do sistema
- Verifique console do navegador para erros
- Teste notificações pelo painel admin

## 🔄 Atualizações e Manutenção

### Versioning
- Mantenha backup dos fluxos funcionais
- Documente alterações importantes
- Teste em ambiente de desenvolvimento primeiro

### Performance
- Monitor tempos de resposta dos webhooks
- Otimize processamento de dados se necessário
- Configure timeouts apropriados

### Segurança  
- Mantenha API Keys seguras
- Use HTTPS para todos os endpoints
- Configure rate limiting se necessário

---

## 🆘 Suporte

Para problemas ou dúvidas:
1. Verifique logs do N8N e Evolution API
2. Teste componentes individualmente
3. Consulte documentação da Evolution API
4. Verifique configurações no painel admin do PoupeJá

**Última atualização**: Janeiro 2025