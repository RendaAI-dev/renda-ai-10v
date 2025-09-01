-- Atualizar status da instância WhatsApp que já está conectada
UPDATE poupeja_evolution_config 
SET 
  connection_status = 'connected',
  phone_connected = 'renda-ai',
  last_connection_check = NOW(),
  webhook_url = 'https://pqhiyqresnjiktkyjshh.supabase.co/functions/v1/evolution-webhook'
WHERE instance_name = 'renda-ai';