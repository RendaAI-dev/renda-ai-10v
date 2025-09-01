-- Drop existing poupeja_notification_logs table and recreate with enhanced structure
DROP TABLE IF EXISTS public.poupeja_notification_logs CASCADE;

-- Tabela de logs de notificações enviadas
CREATE TABLE public.poupeja_notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.poupeja_appointments(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'whatsapp_reminder', 'email_reminder', 'sms_reminder'
  channel TEXT NOT NULL DEFAULT 'whatsapp', -- 'whatsapp', 'email', 'sms'
  status TEXT NOT NULL, -- 'pending', 'sent', 'failed', 'delivered', 'read'
  reminder_time_minutes INTEGER, -- Quantos minutos antes foi enviado
  recipient TEXT NOT NULL, -- Número/email do destinatário
  message_content TEXT,
  message_id TEXT, -- ID da mensagem no provedor (Evolution API)
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}', -- Dados extras da API
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.poupeja_notification_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notification logs" 
ON public.poupeja_notification_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notification logs" 
ON public.poupeja_notification_logs 
FOR INSERT 
WITH CHECK (true); -- Permitir inserção via edge functions

-- Indexes para performance
CREATE INDEX idx_notification_logs_user ON public.poupeja_notification_logs(user_id);
CREATE INDEX idx_notification_logs_appointment ON public.poupeja_notification_logs(appointment_id);
CREATE INDEX idx_notification_logs_status ON public.poupeja_notification_logs(status);
CREATE INDEX idx_notification_logs_created ON public.poupeja_notification_logs(created_at DESC);