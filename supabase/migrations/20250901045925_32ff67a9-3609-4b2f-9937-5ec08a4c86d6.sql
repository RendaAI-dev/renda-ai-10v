-- Remover completamente a constraint que está causando problema
ALTER TABLE public.poupeja_settings DROP CONSTRAINT IF EXISTS poupeja_settings_category_check;

-- Por enquanto, vamos deixar sem constraint para permitir qualquer categoria
-- Isso permite que 'integrations' seja usada sem problemas