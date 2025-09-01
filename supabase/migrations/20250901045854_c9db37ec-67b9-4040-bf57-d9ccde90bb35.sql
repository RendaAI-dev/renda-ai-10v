-- Primeiro, vamos ver quais categorias já existem na tabela
SELECT DISTINCT category FROM public.poupeja_settings;

-- Remover a constraint existente
ALTER TABLE public.poupeja_settings DROP CONSTRAINT IF EXISTS poupeja_settings_category_check;

-- Criar uma constraint mais ampla que inclui todas as categorias que podem existir
ALTER TABLE public.poupeja_settings 
ADD CONSTRAINT poupeja_settings_category_check 
CHECK (category IN ('system', 'branding', 'contact', 'stripe', 'whatsapp', 'plans', 'integrations', 'n8n', 'notifications', 'general', 'sms', 'email', 'payment', 'analytics', 'storage', 'api', 'security', 'ui', 'theme', 'admin'));