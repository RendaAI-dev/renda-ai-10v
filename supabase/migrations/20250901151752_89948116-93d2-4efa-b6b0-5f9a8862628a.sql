-- Tabela de configurações do WhatsApp para cada usuário
CREATE TABLE public.poupeja_whatsapp_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  whatsapp_number TEXT,
  whatsapp_verified BOOLEAN DEFAULT false,
  enable_reminders BOOLEAN DEFAULT true,
  default_reminder_times INTEGER[] DEFAULT ARRAY[30, 1440], -- 30 min e 24h antes
  language TEXT DEFAULT 'pt-BR',
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de logs de notificações
CREATE TABLE public.poupeja_notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  appointment_id UUID REFERENCES public.poupeja_appointments(id) ON DELETE CASCADE,
  whatsapp_number TEXT,
  message_content TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, delivered, failed, read
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de templates de mensagens
CREATE TABLE public.poupeja_message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  template_type TEXT NOT NULL, -- reminder, confirmation, cancellation
  title TEXT NOT NULL,
  message_content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de fila de mensagens WhatsApp
CREATE TABLE public.poupeja_whatsapp_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  appointment_id UUID REFERENCES public.poupeja_appointments(id) ON DELETE CASCADE,
  whatsapp_number TEXT NOT NULL,
  message_content TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued', -- queued, processing, sent, failed
  priority INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for all tables
ALTER TABLE public.poupeja_whatsapp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poupeja_notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poupeja_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poupeja_whatsapp_queue ENABLE ROW LEVEL SECURITY;

-- Policies for poupeja_whatsapp_settings
CREATE POLICY "Users can view their own WhatsApp settings" 
ON public.poupeja_whatsapp_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own WhatsApp settings" 
ON public.poupeja_whatsapp_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WhatsApp settings" 
ON public.poupeja_whatsapp_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policies for poupeja_notification_logs
CREATE POLICY "Users can view their own notification logs" 
ON public.poupeja_notification_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notification logs" 
ON public.poupeja_notification_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification logs" 
ON public.poupeja_notification_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policies for poupeja_message_templates
CREATE POLICY "Users can view message templates" 
ON public.poupeja_message_templates 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create their own message templates" 
ON public.poupeja_message_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own message templates" 
ON public.poupeja_message_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own message templates" 
ON public.poupeja_message_templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Policies for poupeja_whatsapp_queue
CREATE POLICY "Users can view their own WhatsApp queue" 
ON public.poupeja_whatsapp_queue 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own WhatsApp queue items" 
ON public.poupeja_whatsapp_queue 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WhatsApp queue items" 
ON public.poupeja_whatsapp_queue 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Triggers para atualizar updated_at
CREATE TRIGGER update_whatsapp_settings_updated_at
BEFORE UPDATE ON public.poupeja_whatsapp_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_logs_updated_at
BEFORE UPDATE ON public.poupeja_notification_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at
BEFORE UPDATE ON public.poupeja_message_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_queue_updated_at
BEFORE UPDATE ON public.poupeja_whatsapp_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes para performance
CREATE INDEX idx_whatsapp_settings_user ON public.poupeja_whatsapp_settings(user_id);
CREATE INDEX idx_notification_logs_user ON public.poupeja_notification_logs(user_id);
CREATE INDEX idx_notification_logs_appointment ON public.poupeja_notification_logs(appointment_id);
CREATE INDEX idx_message_templates_user ON public.poupeja_message_templates(user_id);
CREATE INDEX idx_message_templates_type ON public.poupeja_message_templates(template_type);
CREATE INDEX idx_whatsapp_queue_user ON public.poupeja_whatsapp_queue(user_id);
CREATE INDEX idx_whatsapp_queue_scheduled ON public.poupeja_whatsapp_queue(scheduled_for);
CREATE INDEX idx_whatsapp_queue_status ON public.poupeja_whatsapp_queue(status);

-- Inserir templates padrão de mensagens
INSERT INTO public.poupeja_message_templates (user_id, template_type, title, message_content, is_default) VALUES
(NULL, 'reminder', 'Lembrete de Compromisso', 
 '🗓️ *Lembrete de Compromisso*\n\nOlá! Você tem um compromisso agendado:\n\n📅 *Data:* {{date}}\n⏰ *Horário:* {{time}}\n📝 *Descrição:* {{description}}\n📍 *Local:* {{location}}\n\nNão esqueça! 😊', 
 true),
 
(NULL, 'confirmation', 'Confirmação de Agendamento', 
 '✅ *Compromisso Confirmado*\n\nSeu compromisso foi agendado com sucesso:\n\n📅 *Data:* {{date}}\n⏰ *Horário:* {{time}}\n📝 *Descrição:* {{description}}\n📍 *Local:* {{location}}\n\nObrigado! 🙏', 
 true),
 
(NULL, 'cancellation', 'Cancelamento de Compromisso', 
 '❌ *Compromisso Cancelado*\n\nSeu compromisso foi cancelado:\n\n📅 *Data:* {{date}}\n⏰ *Horário:* {{time}}\n📝 *Descrição:* {{description}}\n\nSe precisar reagendar, entre em contato conosco.', 
 true);