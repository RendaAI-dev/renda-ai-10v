#!/bin/bash

echo "🔍 TESTANDO EVOLUTION API - RENDA AI"
echo "=================================="

# Configurações do seu projeto
API_URL="https://evo.rendaai.com.br"
API_KEY="D848E2F02A34-4E32-9F13-D6682553E619"
INSTANCE_NAME="renda-ai"
WEBHOOK_URL="https://pqhiyqresnjiktkyjshh.supabase.co/functions/v1/evolution-webhook"

echo "📡 1. Testando conexão com Evolution API..."
response=$(curl -s -w "%{http_code}" -o /tmp/api_test "${API_URL}/instance/fetchInstances" -H "apikey: ${API_KEY}")
if [ "$response" = "200" ]; then
    echo "✅ API Evolution acessível"
else
    echo "❌ API Evolution inacessível (HTTP: $response)"
fi

echo ""
echo "🔗 2. Verificando instância ${INSTANCE_NAME}..."
instance_response=$(curl -s "${API_URL}/instance/connectionState/${INSTANCE_NAME}" -H "apikey: ${API_KEY}")
echo "Resposta da instância: $instance_response"

if echo "$instance_response" | grep -q '"state":"open"'; then
    echo "✅ WhatsApp conectado"
elif echo "$instance_response" | grep -q '"state":"close"'; then
    echo "⚠️ WhatsApp desconectado"
else
    echo "❓ Status desconhecido: $instance_response"
fi

echo ""
echo "🕸️ 3. Testando webhook Supabase..."
webhook_response=$(curl -s -w "%{http_code}" -o /tmp/webhook_test -X POST "${WEBHOOK_URL}" \
    -H "Content-Type: application/json" \
    -d '{
        "event": "test",
        "instance": "'"$INSTANCE_NAME"'",
        "data": {
            "test": true,
            "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
        }
    }')

if [ "$webhook_response" = "200" ]; then
    echo "✅ Webhook respondendo"
else
    echo "❌ Webhook com erro (HTTP: $webhook_response)"
    echo "Resposta: $(cat /tmp/webhook_test)"
fi

echo ""
echo "📱 4. Gerando QR Code para conexão..."
qr_response=$(curl -s "${API_URL}/instance/connect/${INSTANCE_NAME}" -H "apikey: ${API_KEY}")
echo "Resposta QR: $qr_response"

if echo "$qr_response" | grep -q '"code"'; then
    qr_code=$(echo "$qr_response" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)
    echo "📱 QR Code gerado! Acesse:"
    echo "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qr_code}"
elif echo "$qr_response" | grep -q '"state":"open"'; then
    echo "✅ WhatsApp já está conectado!"
else
    echo "⚠️ Não foi possível gerar QR Code"
fi

echo ""
echo "📤 5. Teste de envio de mensagem (apenas se conectado)..."
if echo "$instance_response" | grep -q '"state":"open"'; then
    # Substitua pelo número que você quer testar
    TEST_NUMBER="5537998743075"  # Número que vi nos logs
    
    send_response=$(curl -s -w "%{http_code}" -o /tmp/send_test -X POST "${API_URL}/message/sendText/${INSTANCE_NAME}" \
        -H "apikey: ${API_KEY}" \
        -H "Content-Type: application/json" \
        -d '{
            "number": "'"$TEST_NUMBER"'",
            "text": "🤖 Teste do sistema Renda AI - Evolution API integrado!"
        }')
    
    if [ "$send_response" = "201" ] || [ "$send_response" = "200" ]; then
        echo "✅ Mensagem de teste enviada para $TEST_NUMBER"
    else
        echo "❌ Erro ao enviar mensagem (HTTP: $send_response)"
        echo "Resposta: $(cat /tmp/send_test)"
    fi
else
    echo "⏭️ Pulando teste de envio - WhatsApp não conectado"
fi

echo ""
echo "🔧 6. Status do sistema no Supabase..."
echo "Instance ativo: Verificar no painel admin"
echo "Webhook configurado: $WEBHOOK_URL"
echo "Próximos passos:"
echo "  1. Ativar instância no painel admin (/admin → WhatsApp)"
echo "  2. Escanear QR Code se necessário"
echo "  3. Testar comandos: AGENDA, AJUDA, PARAR"

echo ""
echo "📋 RESUMO DOS PROBLEMAS IDENTIFICADOS:"
echo "❌ Instance is_active: false (precisa ativar no admin)"
echo "❌ WhatsApp settings duplicate key error (verificar logs)"
echo "❌ Webhook parsing error: 'Cannot destructure messageData.data'"

echo ""
echo "🔗 Links úteis:"
echo "Admin Panel: https://4e1777bc-fa52-4cbf-ad51-701364f63ffb.sandbox.lovable.dev/admin"
echo "Evolution API: $API_URL"

# Cleanup
rm -f /tmp/api_test /tmp/webhook_test /tmp/send_test 2>/dev/null