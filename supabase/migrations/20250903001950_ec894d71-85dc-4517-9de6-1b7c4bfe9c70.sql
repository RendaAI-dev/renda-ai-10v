-- Consulta corrigida para ver histórico de execuções
-- A tabela cron.job_run_details usa 'job_id' para fazer join com cron.job
SELECT 
  j.jobname,
  jrd.start_time,
  jrd.end_time,
  jrd.return_message,
  jrd.status
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.job_id
WHERE j.jobname IN ('check-appointment-reminders', 'maintain-appointments-daily')
ORDER BY jrd.start_time DESC 
LIMIT 20;