-- Drop existing poupeja_message_templates table and recreate with enhanced structure
DROP TABLE IF EXISTS public.poupeja_message_templates CASCADE;

-- Tabela de templates de mensagens personalizáveis
CREATE TABLE public.poupeja_message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  language TEXT DEFAULT 'pt-BR',
  channel TEXT DEFAULT 'whatsapp', -- 'whatsapp', 'email', 'sms'
  template_type TEXT NOT NULL, -- 'reminder_30min', 'reminder_24h', 'reminder_custom'
  subject TEXT, -- Para emails
  content TEXT NOT NULL,
  variables TEXT[], -- Variáveis disponíveis: {title}, {date}, {time}, {location}, {description}
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT true, -- Templates do sistema não podem ser deletados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir templates padrão em português
INSERT INTO public.poupeja_message_templates (name, description, template_type, content, variables, is_system) VALUES
(
  'whatsapp_reminder_30min_pt',
  'Lembrete de 30 minutos antes - WhatsApp',
  'reminder_30min',
  '🔔 *Lembrete Importante - Renda AI*

⏰ Seu compromisso é em *30 minutos*!

📌 *{title}*
📅 {date}
🕐 {time}
📍 {location}

💬 {description}

_Sistema Renda AI - Gestão Financeira Pessoal_',
  ARRAY['title', 'date', 'time', 'location', 'description'],
  true
),
(
  'whatsapp_reminder_24h_pt',
  'Lembrete de 24 horas antes - WhatsApp',
  'reminder_24h',
  '📅 *Lembrete de Compromisso - Renda AI*

Você tem um compromisso agendado para amanhã:

📌 *{title}*
📅 {date}
🕐 {time}
📍 {location}

💬 {description}

_Prepare-se com antecedência!_
_Sistema Renda AI_',
  ARRAY['title', 'date', 'time', 'location', 'description'],
  true
),
(
  'whatsapp_reminder_1h_pt',
  'Lembrete de 1 hora antes - WhatsApp',
  'reminder_custom',
  '⏰ *Lembrete - Renda AI*

Seu compromisso é em *1 hora*!

📌 *{title}*
🕐 Às {time}
📍 {location}

_Não se esqueça!_',
  ARRAY['title', 'time', 'location'],
  true
);

-- Enable RLS
ALTER TABLE public.poupeja_message_templates ENABLE ROW LEVEL SECURITY;

-- Policies (todos podem ler, apenas admin pode modificar)
CREATE POLICY "Everyone can view active templates" 
ON public.poupeja_message_templates 
FOR SELECT 
USING (is_active = true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_message_templates_updated_at
BEFORE UPDATE ON public.poupeja_message_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index
CREATE INDEX idx_message_templates_type ON public.poupeja_message_templates(template_type);
CREATE INDEX idx_message_templates_active ON public.poupeja_message_templates(is_active);