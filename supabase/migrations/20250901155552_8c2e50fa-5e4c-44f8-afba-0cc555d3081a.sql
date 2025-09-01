-- Install pg_cron extension if not already installed
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the cron job to execute every 5 minutes
SELECT cron.schedule(
  'process-appointment-reminders', -- job name
  '*/5 * * * *', -- every 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://pqhiyqresnjiktkyjshh.supabase.co/functions/v1/process-appointment-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxaGl5cXJlc25qaWt0a3lqc2hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDE4NjgsImV4cCI6MjA3MTg3Nzg2OH0.xLNsCPWyyzqcd0uv-Z7q_slJ8Hh1Ac7iQuf-U_vNM_8',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('trigger', 'cron')
  );
  $$
);

-- Verify the job was created
SELECT * FROM cron.job WHERE jobname = 'process-appointment-reminders';