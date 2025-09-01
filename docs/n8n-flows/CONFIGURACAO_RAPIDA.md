# 🚀 Configuração Rápida - N8N + Evolution API

## ⚡ Setup em 5 Minutos

### 1️⃣ **Importar Fluxo Simples**
- Baixe: `simple-flow.json`
- N8N → Import from file → Selecionar arquivo
- ✅ Fluxo importado!

### 2️⃣ **Editar Configurações**
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
- **Telefone Teste**: `+5511999999999`
- **Salvar** → **Testar Notificação**

---

## 🔧 **Onde Pegar as Informações**

### 🌐 **Evolution API URL**
```
https://evolution.seudominio.com
https://api.evolution.app.br  
http://localhost:8080
```

### 🔑 **Evolution API Key** 
```bash
# No seu painel Evolution API
curl -X GET "https://sua-evolution-api.com/instance/fetchInstances" \
  -H "apikey: SUA_API_KEY"
```

### 📱 **Nome da Instância**
```
minhaInstancia
empresa01
whatsapp-bot
```

---

## 🧪 **Testar Configuração**

### Teste Manual Evolution API:
```bash
curl -X POST "https://sua-evolution-api.com/message/sendText/sua-instancia" \
  -H "apikey: sua-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "textMessage": {
      "text": "Teste Evolution API! 🚀"
    }
  }'
```

### Teste N8N:
```bash
curl -X POST "https://seu-n8n.com/webhook/poupeja-simple" \
  -H "Content-Type: application/json" \
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

## ❌ **Problemas Comuns**

| Erro | Solução |
|------|---------|
| `401 Unauthorized` | ❌ API Key incorreta |
| `404 Not Found` | ❌ URL ou instância errada |
| `Connection timeout` | ❌ Evolution API offline |
| `Invalid phone` | ❌ Telefone sem DDI (55) |
| `Webhook not receiving` | ❌ URL incorreta no PoupeJá |

---

## 📱 **Formatos de Telefone Aceitos**

✅ **Funcionam**:
- `11999999999`
- `+5511999999999` 
- `5511999999999`

❌ **Não funcionam**:
- `(11) 99999-9999`
- `11 99999-9999`
- `99999-9999`

O fluxo normaliza automaticamente! 🔄

---

## 🎯 **Checklist Final**

- [ ] Evolution API funcionando
- [ ] Instância WhatsApp conectada  
- [ ] N8N acessível externamente
- [ ] Fluxo importado e ativo
- [ ] Configurações editadas
- [ ] URL configurada no PoupeJá
- [ ] Teste enviado com sucesso

## 🆘 **Suporte Rápido**

1. **Logs N8N**: Executions → Ver detalhes do erro
2. **Teste Evolution**: Usar curl ou Postman
3. **Verificar Instância**: Status conectado no painel
4. **Console PoupeJá**: F12 → Console → Erros

---

**✅ Pronto! Suas notificações WhatsApp estão funcionando!** 🎉