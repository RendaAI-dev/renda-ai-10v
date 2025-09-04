-- Atualizar tabela poupeja_subscriptions para suportar os 4 novos planos
ALTER TABLE public.poupeja_subscriptions 
ADD COLUMN IF NOT EXISTS reminder_limit INTEGER DEFAULT 15;

-- Comentar a coluna para documentação
COMMENT ON COLUMN public.poupeja_subscriptions.reminder_limit IS 'Limite de lembretes por mês para este plano (15 para básico, 50 para pro)';

-- Criar tabela para controle de uso de lembretes mensais
CREATE TABLE IF NOT EXISTS public.poupeja_reminder_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  month_year TEXT NOT NULL, -- formato 'YYYY-MM'
  reminders_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_year)
);

-- Habilitar RLS na nova tabela
ALTER TABLE public.poupeja_reminder_usage ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para poupeja_reminder_usage
CREATE POLICY "Users can view their own reminder usage" 
ON public.poupeja_reminder_usage 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own reminder usage" 
ON public.poupeja_reminder_usage 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reminder usage" 
ON public.poupeja_reminder_usage 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all reminder usage" 
ON public.poupeja_reminder_usage 
FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_reminder_usage_updated_at
    BEFORE UPDATE ON public.poupeja_reminder_usage
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir configurações de preços para os novos planos Pro
INSERT INTO public.poupeja_settings (category, key, value, value_type, description, created_by, updated_by) VALUES
('pricing', 'plan_price_monthly_pro', '29,90', 'string', 'Preço do plano mensal Pro', auth.uid(), auth.uid()),
('pricing', 'plan_price_annual_pro', '299,90', 'string', 'Preço do plano anual Pro', auth.uid(), auth.uid()),
('stripe', 'stripe_price_id_monthly_pro', '', 'string', 'ID do preço mensal Pro no Stripe', auth.uid(), auth.uid()),
('stripe', 'stripe_price_id_annual_pro', '', 'string', 'ID do preço anual Pro no Stripe', auth.uid(), auth.uid())
ON CONFLICT (category, key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_by = auth.uid(),
  updated_at = NOW();

-- Função para obter limite de lembretes do usuário
CREATE OR REPLACE FUNCTION public.get_user_reminder_limit(p_user_id UUID DEFAULT auth.uid())
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_limit INTEGER := 15; -- padrão básico
BEGIN
  SELECT reminder_limit INTO user_limit
  FROM public.poupeja_subscriptions
  WHERE user_id = p_user_id 
    AND status = 'active'
    AND current_period_end > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(user_limit, 15);
END;
$$;

-- Função para obter uso de lembretes do mês atual
CREATE OR REPLACE FUNCTION public.get_current_month_usage(p_user_id UUID DEFAULT auth.uid())
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_usage INTEGER := 0;
  current_month TEXT := to_char(NOW(), 'YYYY-MM');
BEGIN
  SELECT reminders_used INTO current_usage
  FROM public.poupeja_reminder_usage
  WHERE user_id = p_user_id 
    AND month_year = current_month;
  
  RETURN COALESCE(current_usage, 0);
END;
$$;

-- Função para incrementar uso de lembretes
CREATE OR REPLACE FUNCTION public.increment_reminder_usage(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month TEXT := to_char(NOW(), 'YYYY-MM');
  current_usage INTEGER;
  user_limit INTEGER;
BEGIN
  -- Obter limite do usuário
  user_limit := public.get_user_reminder_limit(p_user_id);
  
  -- Obter uso atual
  current_usage := public.get_current_month_usage(p_user_id);
  
  -- Verificar se ainda pode usar lembretes
  IF current_usage >= user_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Inserir ou atualizar uso
  INSERT INTO public.poupeja_reminder_usage (user_id, month_year, reminders_used)
  VALUES (p_user_id, current_month, 1)
  ON CONFLICT (user_id, month_year)
  DO UPDATE SET 
    reminders_used = poupeja_reminder_usage.reminders_used + 1,
    updated_at = NOW();
  
  RETURN TRUE;
END;
$$;

-- Atualizar limites de lembretes para planos existentes
UPDATE public.poupeja_subscriptions 
SET reminder_limit = CASE 
  WHEN plan_type = 'monthly' THEN 15
  WHEN plan_type = 'annual' THEN 15
  ELSE 15
END
WHERE reminder_limit IS NULL;