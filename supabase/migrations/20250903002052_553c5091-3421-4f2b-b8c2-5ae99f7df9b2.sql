-- Instalar a extensão http corretamente
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Recriar o cron job com a função net.http_post corretamente referenciada
SELECT cron.unschedule('check-appointment-reminders');

SELECT cron.schedule(
  'check-appointment-reminders',
  '*/5 * * * *',
  $$
  SELECT extensions.http_post(
    url := 'https://pqhiyqresnjiktkyjshh.supabase.co/functions/v1/appointment-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxaGl5cXJlc25qaWt0a3lqc2hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDE4NjgsImV4cCI6MjA3MTg3Nzg2OH0.xLNsCPWyyzqcd0uv-Z7q_slJ8Hh1Ac7iQuf-U_vNM_8',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'trigger', 'cron',
      'timestamp', now()
    )
  ) as request_id;
  $$
);