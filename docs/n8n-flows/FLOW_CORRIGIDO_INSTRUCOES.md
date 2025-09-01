# 🔧 Fluxo N8N Corrigido - Instruções de Uso

## 📋 Arquivo Corrigido

**Arquivo:** `poupeja-corrected-flow.json`

Este é o fluxo N8N corrigido que resolve todos os problemas identificados nos fluxos anteriores.

## ✅ Problemas Corrigidos

### 1. **Código JavaScript Melhorado**
- ✅ Sintaxe correta em todas as interpolações de strings
- ✅ Validação robusta de dados de entrada
- ✅ Logs detalhados para debugging
- ✅ Tratamento de erros abrangente

### 2. **Configuração Dinâmica**
- ✅ URL da Evolution API configurada dinamicamente via payload
- ✅ API Key configurada dinamicamente via payload
- ✅ Instância configurada dinamicamente via payload
- ✅ Fallbacks para configurações não fornecidas

### 3. **Normalização de Telefone**
- ✅ Remove caracteres não numéricos
- ✅ Adiciona código do país (55) se necessário
- ✅ Adiciona nono dígito para celulares
- ✅ Validação de comprimento final (13 dígitos)

### 4. **Mensagens Personalizadas**
- ✅ Mensagens específicas para cada tipo de evento
- ✅ Formatação adequada de datas e valores
- ✅ Fallback para eventos não reconhecidos

### 5. **Tratamento de Erros**
- ✅ Logs detalhados de erros
- ✅ Respostas HTTP apropriadas
- ✅ Tratamento de erro de conexão com Evolution API

## 🚀 Como Usar

### 1. **Importar o Fluxo no N8N**
1. Abra sua instância do N8N
2. Clique em "Import from File"
3. Selecione o arquivo `poupeja-corrected-flow.json`
4. Clique em "Import"

### 2. **Configurar as Credenciais**
O fluxo agora aceita configurações dinâmicas. O PoupeJá deve enviar as configurações no payload:

```json
{
  "type": "appointment_reminder",
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "phone": "11999999999",
    "email": "joao@email.com"
  },
  "data": {
    "title": "Consulta Médica",
    "date": "2025-01-15T14:30:00Z",
    "location": "Hospital ABC"
  },
  "message": "Mensagem personalizada (opcional)",
  "metadata": {
    "evolutionApi": {
      "apiUrl": "https://sua-evolution-api.com",
      "apiKey": "sua-api-key-real",
      "instance": "sua-instancia"
    }
  }
}
```

### 3. **Ativar o Fluxo**
1. Após importar, clique no fluxo
2. Clique no botão "Active" para ativá-lo
3. Copie a URL do webhook para usar no PoupeJá

## 📊 Estrutura do Fluxo

```
🎯 Webhook PoupeJá
    ↓
⚙️ Processar Dados (JavaScript robusto)
    ↓
✅ Dados Válidos? (Validação)
    ↓ (sim)           ↓ (não)
📲 Enviar WhatsApp    📝 Log Erro
    ↓                    ↓
📝 Log Sucesso        ❌ Erro
    ↓
✅ Sucesso
```

## 🔍 Logs e Debugging

O fluxo inclui logs detalhados para facilitar o debugging:

- **📥 Dados recebidos:** Log completo do payload
- **📱 Normalização de telefone:** Cada etapa do processo
- **💬 Construção de mensagem:** Tipo de evento e mensagem gerada
- **🔧 Configuração Evolution API:** URLs e instâncias utilizadas
- **✅/❌ Resultados:** Sucesso ou falha com detalhes

## 📱 Tipos de Evento Suportados

- `appointment_reminder` / `appointment_created`
- `transaction_reminder` / `transaction_due`
- `goal_progress` / `goal_achieved`
- `budget_exceeded`
- `custom` (mensagem personalizada)

## 🆘 Troubleshooting

### Problema: "Telefone inválido"
- **Causa:** Telefone não normalizado corretamente
- **Solução:** Verificar se o telefone tem formato brasileiro válido

### Problema: "Falha ao enviar WhatsApp"
- **Causa:** Configuração da Evolution API incorreta
- **Solução:** Verificar URL, API Key e instância no payload

### Problema: "Dados inválidos ou ausentes"
- **Causa:** Payload do webhook malformado
- **Solução:** Verificar estrutura JSON enviada pelo PoupeJá

## 📈 Melhorias Implementadas

1. **Performance:** Processamento mais eficiente
2. **Confiabilidade:** Tratamento robusto de erros
3. **Flexibilidade:** Configuração dinâmica via payload
4. **Observabilidade:** Logs detalhados para debugging
5. **Escalabilidade:** Estrutura preparada para novos tipos de evento

## 🔄 Compatibilidade

Este fluxo é **compatível** com:
- ✅ N8N versão 1.0+
- ✅ Evolution API v1.5+
- ✅ PoupeJá (todas as versões)

## 📝 Próximos Passos

1. Atualizar o PoupeJá para enviar as configurações no payload
2. Testar com dados reais
3. Monitorar logs para ajustes finos
4. Documentar configurações específicas por usuário