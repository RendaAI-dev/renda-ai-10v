-- Primeiro, vamos verificar qual constraint está causando o problema
SELECT conname, pg_get_constraintdef(oid) as definition 
FROM pg_constraint 
WHERE conrelid = 'public.poupeja_settings'::regclass 
AND conname LIKE '%category%';

-- Remover a constraint que está impedindo a categoria 'integrations'
ALTER TABLE public.poupeja_settings DROP CONSTRAINT IF EXISTS poupeja_settings_category_check;

-- Criar uma nova constraint que permite 'integrations' junto com outras categorias válidas
ALTER TABLE public.poupeja_settings 
ADD CONSTRAINT poupeja_settings_category_check 
CHECK (category IN ('system', 'branding', 'contact', 'stripe', 'whatsapp', 'plans', 'integrations', 'n8n', 'notifications', 'general'));