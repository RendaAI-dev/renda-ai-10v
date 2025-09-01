-- Tabela de configuração da Evolution API (configuração global do sistema)
CREATE TABLE public.poupeja_evolution_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_name TEXT NOT NULL,
  api_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT true,
  connection_status TEXT DEFAULT 'disconnected', -- 'connected', 'disconnected', 'error'
  last_connection_check TIMESTAMP WITH TIME ZONE,
  qr_code TEXT, -- QR Code para conectar o WhatsApp
  phone_connected TEXT, -- Número conectado
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para fila de mensagens (queue)
CREATE TABLE public.poupeja_message_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.poupeja_appointments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  recipient_number TEXT NOT NULL,
  message_content TEXT NOT NULL,
  template_id UUID REFERENCES public.poupeja_message_templates(id),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'sent', 'failed'
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.poupeja_evolution_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poupeja_message_queue ENABLE ROW LEVEL SECURITY;

-- Policies para Evolution Config (apenas admin)
CREATE POLICY "Only admins can manage Evolution config" 
ON public.poupeja_evolution_config 
FOR ALL 
USING (is_admin_user());

-- Policies para Message Queue
CREATE POLICY "Users can view their own queued messages" 
ON public.poupeja_message_queue 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage message queue" 
ON public.poupeja_message_queue 
FOR ALL 
USING (true);

-- Triggers
CREATE TRIGGER update_evolution_config_updated_at
BEFORE UPDATE ON public.poupeja_evolution_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_message_queue_status ON public.poupeja_message_queue(status);
CREATE INDEX idx_message_queue_scheduled ON public.poupeja_message_queue(scheduled_for);
CREATE INDEX idx_message_queue_user ON public.poupeja_message_queue(user_id);

-- Inserir configuração inicial (você deve atualizar com seus dados)
INSERT INTO public.poupeja_evolution_config (
  instance_name,
  api_url,
  api_key,
  is_active,
  connection_status
) VALUES (
  'renda-ai-instance',
  'http://localhost:8080', -- Atualize com sua URL da Evolution API
  'your-evolution-api-key', -- Atualize com sua API Key
  false,
  'disconnected'
) ON CONFLICT DO NOTHING;