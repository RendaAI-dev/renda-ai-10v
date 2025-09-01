# 🔄 Integração Completa N8N + Supabase + Evolution API

Este guia mostra como configurar uma integração completa entre N8N, Supabase e Evolution API para automações avançadas no PoupeJá.

## 📋 Pré-requisitos

1. ✅ N8N instalado e funcionando
2. ✅ Evolution API configurada
3. ✅ Supabase com as credenciais corretas
4. ✅ PoupeJá com integração ativada

## 🚀 Configuração Rápida

### 1. Importar o Flow Completo

1. Faça download do arquivo `complete-integration-flow.json`
2. No N8N, vá em **Workflows** → **Import from File**
3. Selecione o arquivo baixado
4. Ative o workflow

### 2. Configurar Evolution API

No nó **"📨 Enviar WhatsApp"**, atualize:

```json
{
  "url": "https://SUA_EVOLUTION_API.com/message/sendText/SUA_INSTANCIA",
  "headers": {
    "apikey": "SUA_API_KEY_AQUI"
  }
}
```

### 3. Configurar Supabase (Opcional)

No nó **"📊 Log no Supabase"**, configure:
- **Supabase URL**: Sua URL do Supabase
- **Service Key**: Chave de serviço do Supabase
- **Table**: `poupeja_automation_logs`

### 4. Configurar no PoupeJá

1. Acesse o **Admin Dashboard** → **N8N**
2. Configure:
   - **URL do Webhook**: `https://seu-n8n.com/webhook/poupeja-complete`
   - **Nome da Instância**: Sua instância Evolution API
   - **API Key**: (opcional) Para autenticação
3. **Ative a integração**
4. **Teste a conexão**

## 🎯 Eventos Suportados

### 1. Compromisso Criado (`appointment_created`)
```json
{
  "event": "appointment_created",
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "phone": "5511999999999",
    "email": "joao@email.com"
  },
  "data": {
    "id": "appointment-uuid",
    "title": "Consulta Médica",
    "description": "Consulta de rotina",
    "date": "2024-01-15T10:00:00Z",
    "category": "saude",
    "status": "pending"
  },
  "automationRules": {
    "sendWhatsApp": true,
    "reminderMinutes": 60,
    "priority": "medium"
  }
}
```

### 2. Transação Vencendo (`transaction_due`)
```json
{
  "event": "transaction_due",
  "user": {
    "id": "uuid",
    "name": "Maria Santos",
    "phone": "5511888888888",
    "email": "maria@email.com"
  },
  "data": {
    "id": "transaction-uuid",
    "title": "Conta de Luz",
    "amount": 150.50,
    "date": "2024-01-20",
    "status": "pending"
  },
  "automationRules": {
    "sendWhatsApp": true,
    "reminderMinutes": 60,
    "priority": "high"
  }
}
```

### 3. Progresso da Meta (`goal_progress`)
```json
{
  "event": "goal_progress",
  "user": {
    "id": "uuid",
    "name": "Carlos Oliveira",
    "phone": "5511777777777",
    "email": "carlos@email.com"
  },
  "data": {
    "id": "goal-uuid",
    "title": "Viagem para Europa",
    "amount": 7500.00,
    "metadata": {
      "target_amount": 10000.00,
      "progress_percent": 75.0,
      "remaining_amount": 2500.00
    }
  },
  "automationRules": {
    "sendWhatsApp": true,
    "priority": "medium"
  }
}
```

### 4. Orçamento Excedido (`budget_exceeded`)
```json
{
  "event": "budget_exceeded",
  "user": {
    "id": "uuid",
    "name": "Ana Costa",
    "phone": "5511666666666",
    "email": "ana@email.com"
  },
  "data": {
    "id": "budget-uuid",
    "title": "Orçamento: Alimentação",
    "amount": 200.00,
    "metadata": {
      "budget_amount": 800.00,
      "spent_amount": 1000.00,
      "period": "monthly"
    }
  },
  "automationRules": {
    "sendWhatsApp": true,
    "priority": "high"
  }
}
```

## 📨 Exemplos de Mensagens WhatsApp

### Compromisso Agendado
```
🗓️ *Compromisso Agendado*

Olá João Silva!

📅 **Consulta Médica**
📝 Consulta de rotina
📆 Data: segunda-feira, 15 de janeiro de 2024 às 10:00

✅ Seu compromisso foi registrado com sucesso!
```

### Lembrete de Pagamento
```
💰 *Lembrete de Pagamento*

Olá Maria Santos!

💸 **Conta de Luz**
💵 Valor: R$ 150,50
📅 Vencimento: 20/01/2024

⏰ Não esqueça de fazer seu pagamento!
```

### Progresso da Meta
```
🎯 *Progresso da Meta*

Olá Carlos Oliveira!

🏆 **Viagem para Europa**
💰 Valor atual: R$ 7.500,00
🎯 Meta: R$ 10.000,00
📊 Progresso: 75.0%

💪 Continue assim, você está no caminho certo!
```

### Orçamento Excedido
```
⚠️ *Orçamento Excedido*

Olá Ana Costa!

📊 **Orçamento: Alimentação**
💰 Orçamento: R$ 800,00
💸 Gasto: R$ 1.000,00
📈 Excesso: R$ 200,00

💡 Que tal revisar seus gastos este mês?
```

## 🛠️ Testes e Debugging

### 1. Testar Conexão
Use o botão **"Testar"** no Admin Dashboard para enviar um payload de teste.

### 2. Logs do N8N
Verifique os logs no N8N para acompanhar a execução:
- **Executions** → Selecione a execução → Veja os detalhes

### 3. Logs do Evolution API
Monitore os logs da Evolution API para verificar o envio das mensagens.

### 4. Logs do Supabase
Se configurado, verifique a tabela `poupeja_automation_logs` no Supabase.

## 🔒 Segurança

1. **API Keys**: Nunca exponha suas chaves de API
2. **Webhook URL**: Use HTTPS sempre
3. **Validação**: O flow valida dados antes de processar
4. **Rate Limiting**: Configure limites no N8N se necessário

## 📈 Monitoramento

### Métricas Importantes
- ✅ Taxa de entrega de mensagens
- ⏱️ Tempo de resposta do webhook
- 📊 Eventos processados por hora
- ❌ Taxa de erro

### Alertas Recomendados
- 🚨 Webhook fora do ar
- 📱 Evolution API indisponível
- 💾 Falhas no Supabase
- ⚠️ Taxa de erro > 5%

## 🆘 Solução de Problemas

### Webhook não recebe dados
1. Verifique se a URL está correta
2. Confirme se o N8N está ativo
3. Teste a URL manualmente

### WhatsApp não envia
1. Verifique a API Key da Evolution API
2. Confirme se a instância está ativa
3. Valide o formato do telefone

### Supabase não registra logs
1. Verifique as credenciais
2. Confirme se a tabela existe
3. Teste a conexão

## 📚 Recursos Adicionais

- [Documentação N8N](https://docs.n8n.io/)
- [Evolution API Docs](https://doc.evolution-api.com/)
- [Supabase Docs](https://supabase.com/docs)
- [PoupeJá Support](mailto:support@poupeja.com)

---

✅ **Integração configurada com sucesso!** 
Agora você tem automações completas funcionando entre N8N, Supabase e Evolution API.