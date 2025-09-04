-- Confirmar todos os emails automaticamente para resolver problemas de login
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Criar função para auto-confirmação de emails
CREATE OR REPLACE FUNCTION public.auto_confirm_user_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirmar email na criação
  NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para auto-confirmação
DROP TRIGGER IF EXISTS auto_confirm_email_trigger ON auth.users;
CREATE TRIGGER auto_confirm_email_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user_email();

-- Função para recuperar usuários com problemas de login
CREATE OR REPLACE FUNCTION public.fix_user_auth_issues(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Buscar usuário por email
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RAISE NOTICE 'Usuário não encontrado: %', user_email;
    RETURN FALSE;
  END IF;
  
  -- Confirmar email
  UPDATE auth.users 
  SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
  WHERE id = user_id;
  
  -- Garantir que usuário existe na tabela poupeja_users
  INSERT INTO public.poupeja_users (id, email, name)
  VALUES (user_id, user_email, split_part(user_email, '@', 1))
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RAISE NOTICE 'Usuário recuperado: %', user_email;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.fix_user_auth_issues(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fix_user_auth_issues(TEXT) TO service_role;