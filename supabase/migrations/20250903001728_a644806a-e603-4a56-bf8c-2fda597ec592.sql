-- Função para manutenção diária dos compromissos
CREATE OR REPLACE FUNCTION maintain_appointments()
RETURNS void AS $$
BEGIN
  -- Reset reminder_sent para compromissos futuros que já passaram do horário de lembrete
  UPDATE poupeja_appointments
  SET reminder_sent = false,
      updated_at = NOW()
  WHERE appointment_date > NOW()
    AND status = 'pending'
    AND reminder_sent = true;
  
  -- Marca como completed compromissos que já passaram há mais de 1 hora
  UPDATE poupeja_appointments
  SET status = 'completed',
      updated_at = NOW()
  WHERE appointment_date < NOW() - INTERVAL '1 hour'
    AND status = 'pending';
    
  -- Cancela compromissos muito antigos (mais de 30 dias) que ainda estão pending
  UPDATE poupeja_appointments
  SET status = 'cancelled',
      updated_at = NOW()
  WHERE appointment_date < NOW() - INTERVAL '30 days'
    AND status = 'pending';
    
  -- Log da manutenção executada
  RAISE NOTICE 'Manutenção de compromissos executada em %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Agendar manutenção diária às 00:00
SELECT cron.schedule(
  'maintain-appointments-daily',
  '0 0 * * *',  -- meia-noite todos os dias
  $$SELECT maintain_appointments();$$
);