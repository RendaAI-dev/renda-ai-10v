-- Criar nova função is_admin_user sem conflitos
CREATE OR REPLACE FUNCTION public.is_admin_user(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p_user_id AND ur.role = 'admin'
  );
END;
$function$;

-- Atualizar políticas RLS da tabela poupeja_settings para usar a nova função
DROP POLICY IF EXISTS "Only admins can view settings" ON public.poupeja_settings;
DROP POLICY IF EXISTS "Only admins can insert settings" ON public.poupeja_settings;
DROP POLICY IF EXISTS "Only admins can update settings" ON public.poupeja_settings;
DROP POLICY IF EXISTS "Only admins can delete settings" ON public.poupeja_settings;

CREATE POLICY "Only admins can view settings"
ON public.poupeja_settings
FOR SELECT USING (is_admin_user());

CREATE POLICY "Only admins can insert settings"
ON public.poupeja_settings
FOR INSERT WITH CHECK (is_admin_user());

CREATE POLICY "Only admins can update settings"
ON public.poupeja_settings
FOR UPDATE USING (is_admin_user());

CREATE POLICY "Only admins can delete settings"
ON public.poupeja_settings
FOR DELETE USING (is_admin_user());

-- Atualizar políticas da tabela poupeja_settings_history
DROP POLICY IF EXISTS "Only admins can view settings history" ON public.poupeja_settings_history;

CREATE POLICY "Only admins can view settings history"
ON public.poupeja_settings_history
FOR SELECT USING (is_admin_user());

-- Atualizar políticas da tabela poupeja_uploads
DROP POLICY IF EXISTS "Admins can view all uploads" ON public.poupeja_uploads;

CREATE POLICY "Admins can view all uploads"
ON public.poupeja_uploads
FOR SELECT USING (is_admin_user());

-- Remover a função antiga que causava conflito
DROP FUNCTION IF EXISTS public.is_admin(uuid);

-- Criar a função is_admin correta como alias da nova função
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN is_admin_user(p_user_id);
END;
$function$;