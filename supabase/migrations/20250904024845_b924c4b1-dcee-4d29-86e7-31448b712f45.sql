-- Adicionar configurações de limite de lembretes usando o tipo correto
INSERT INTO public.poupeja_settings (category, key, value, value_type, description, created_by, updated_by)
VALUES 
  ('pricing', 'reminder_limit_basic', '15', 'string', 'Limite de lembretes mensais para plano Basic', auth.uid(), auth.uid()),
  ('pricing', 'reminder_limit_pro', '50', 'string', 'Limite de lembretes mensais para plano Pro', auth.uid(), auth.uid())
ON CONFLICT (category, key) DO UPDATE SET
  value = EXCLUDED.value,
  value_type = EXCLUDED.value_type,
  description = EXCLUDED.description,
  updated_at = NOW();