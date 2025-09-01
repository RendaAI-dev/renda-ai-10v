# 🚀 N8N Flows para PoupeJá + Evolution API

## 📋 Fluxos Disponíveis

### 1. 🎯 `simple-flow.json` (RECOMENDADO)
- ✅ **Mais fácil de configurar**
- ✅ **Funciona imediatamente**
- ✅ **Apenas 3 configurações necessárias**
- ⚡ **Setup em 5 minutos**

### 2. 🔧 `evolution-api-webhook-flow.json`
- ✅ **Fluxo mais completo**
- ✅ **Melhor tratamento de erros**
- ⚠️ **Requer mais configurações**

### 3. 🚀 `evolution-api-node-flow.json`
- ✅ **Usa node nativo Evolution API**
- ✅ **Integração mais robusta**
- ⚠️ **Requer instalação do node Evolution API no N8N**

---

## ⚡ Setup Rápido (5 Minutos)

### 1️⃣ **Importar Fluxo**
1. Baixe `simple-flow.json`
2. N8N → Import from file → Selecionar arquivo
3. ✅ Fluxo importado!

### 2️⃣ **Configurar Evolution API**
No node **"⚙️ Processar Dados"**, edite as 3 linhas:

```javascript
const EVOLUTION_API_URL = 'https://sua-evolution-api.com';  // ⚠️ SUA URL AQUI
const EVOLUTION_API_KEY = 'sua-api-key';                   // ⚠️ SUA API KEY AQUI  
const EVOLUTION_INSTANCE = 'sua-instancia';                // ⚠️ SUA INSTÂNCIA AQUI
```

### 3️⃣ **Ativar Fluxo**
- Clique em **"Active"** ✅
- Copie a **URL do Webhook**: `https://seu-n8n.com/webhook/poupeja-simple`

### 4️⃣ **Configurar PoupeJá**
- Acesse: `/admin` → Aba **"WhatsApp + N8N"**
- **Ativar**: ✅ ON
- **URL Webhook**: `https://seu-n8n.com/webhook/poupeja-simple`
- **Salvar** → **Testar Notificação**

---

## 🔧 Configuração PoupeJá

### Painel Admin (`/admin`)
1. Vá para aba **"WhatsApp + N8N"**
2. **Ativar WhatsApp**: ✅ Marcar
3. **N8N Webhook URL**: `https://seu-n8n.com/webhook/poupeja-simple`
4. **Telefone Teste**: `+5511999999999`
5. **Salvar Configurações**
6. **Testar Notificação** → Deve chegar WhatsApp!

---

## 📱 Formato dos Dados Enviados

### 🗓️ **Lembrete de Compromisso**
```json
{
  "type": "appointment_reminder",
  "user": {
    "phone": "11999999999",
    "name": "João Silva"
  },
  "appointment": {
    "title": "Consulta Médica",
    "date": "2025-01-27T14:30:00Z",
    "location": "Hospital São Paulo",
    "minutesUntil": 30
  }
}
```

### 💰 **Lembrete de Transação**
```json
{
  "type": "transaction_reminder",
  "user": {
    "phone": "11999999999",
    "name": "Maria Santos"
  },
  "transaction": {
    "title": "Conta de Luz",
    "amount": 150.50,
    "due_date": "2025-01-30T23:59:59Z",
    "description": "Conta de energia elétrica",
    "category": "Contas Fixas"
  }
}
```

### 📲 **Mensagem Personalizada**
```json
{
  "type": "custom_notification",
  "user": {
    "phone": "11999999999",
    "name": "Pedro Costa"
  },
  "message": "Sua mensagem personalizada aqui!"
}
```

---

## 📝 Exemplos de Mensagens WhatsApp

### 🗓️ **Compromisso**
```
🗓️ *Lembrete de Compromisso*

Olá João Silva!

📅 Consulta Médica
🕐 27/01/2025 às 14:30
📍 Hospital São Paulo

💡 *PoupeJá*
```

### 💰 **Transação**
```
💰 *Lembrete Financeiro*

Olá Maria Santos!

📝 Conta de Luz
💵 R$ 150,50
📅 30/01/2025

💡 *PoupeJá*
```

---

## 🔍 Troubleshooting

### ❌ **Problemas Comuns**

| Erro | Solução |
|------|---------|
| `401 Unauthorized` | ❌ API Key incorreta |
| `404 Not Found` | ❌ URL ou instância errada |
| `Connection timeout` | ❌ Evolution API offline |
| `Invalid phone` | ❌ Telefone sem DDI (55) |
| `Webhook not receiving` | ❌ URL incorreta no PoupeJá |

### 🧪 **Testar Evolution API**
```bash
curl -X POST "https://sua-evolution-api.com/message/sendText/sua-instancia" \\
  -H "apikey: sua-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "number": "5511999999999",
    "textMessage": {
      "text": "Teste Evolution API! 🚀"
    }
  }'
```

### 🧪 **Testar N8N**
```bash
curl -X POST "https://seu-n8n.com/webhook/poupeja-simple" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "test",
    "user": {
      "name": "Teste",
      "phone": "11999999999"
    },
    "message": "Teste N8N + Evolution! 🎉"
  }'
```

---

## 📊 Monitoramento

### **N8N**
- **Executions**: Ver histórico de execuções
- **Logs**: Detalhes de cada node
- **Errors**: Stack trace completo

### **Evolution API**
- **Status**: Verificar se instância está conectada
- **Logs**: Ver logs de envio
- **Queue**: Verificar fila de mensagens

### **PoupeJá**
- **Console**: F12 → Console → Erros JavaScript
- **Network**: Requisições para webhook
- **Admin Panel**: Status das configurações

---

## 🔄 Versionamento

### **v1.0.0** - Versão Inicial
- ✅ Suporte a lembretes de compromissos
- ✅ Suporte a lembretes de transações
- ✅ Normalização automática de telefones
- ✅ Mensagens personalizadas

### **Próximas Versões**
- 📊 Analytics de mensagens enviadas
- 🔄 Queue com retry automático
- 📱 Suporte a mídia (imagens/documentos)
- 🤖 Integração com ChatGPT/IA

---

## 🛡️ Segurança

### **Recomendações**
- ✅ Use HTTPS para webhooks
- ✅ Valide dados de entrada
- ✅ Configure rate limiting
- ✅ Monitore logs regularmente
- ✅ Mantenha Evolution API atualizada

### **Configuração de Headers**
```javascript
// Headers recomendados para Evolution API
{
  "apikey": "sua-chave-secreta",
  "Content-Type": "application/json",
  "User-Agent": "PoupeJá-N8N/1.0"
}
```

---

## 📈 Performance

### **Otimizações**
- ⚡ Use webhooks em vez de polling
- ⚡ Configure timeout adequado (30s)
- ⚡ Implemente cache para dados repetitivos
- ⚡ Use queue para alta volumetria

### **Limites Recomendados**
- **Mensagens/minuto**: 60
- **Timeout**: 30 segundos
- **Retry**: 3 tentativas
- **Queue size**: 1000 mensagens

---

## 🆘 Suporte

### **Ordem de Verificação**
1. ✅ Evolution API funcionando?
2. ✅ Instância WhatsApp conectada?
3. ✅ N8N acessível externamente?
4. ✅ Webhook URL correta no PoupeJá?
5. ✅ API Key e configurações corretas?

### **Logs para Verificar**
- **N8N**: Executions → Ver detalhes
- **Evolution API**: Console/logs da aplicação
- **PoupeJá**: Browser console (F12)
- **Servidor**: Logs de proxy/nginx se aplicável

### **Checklist Final**
- [ ] Evolution API funcionando
- [ ] Instância WhatsApp conectada
- [ ] N8N acessível externamente
- [ ] Fluxo importado e ativo
- [ ] Configurações editadas corretamente
- [ ] URL configurada no PoupeJá
- [ ] Teste enviado com sucesso

---

**✅ Pronto! Suas notificações WhatsApp estão funcionando!** 🎉