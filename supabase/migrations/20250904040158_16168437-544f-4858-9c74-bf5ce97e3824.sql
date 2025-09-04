-- Atualizar a função handle_auth_user_created para ser mais robusta
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_name TEXT;
  user_phone TEXT;
  user_cpf TEXT;
  user_birth_date DATE;
BEGIN
  -- Log detalhado
  RAISE WARNING '[AUTH_TRIGGER] Usuário criado no auth.users - ID: %, Email: %', NEW.id, NEW.email;
  
  -- Confirmar email automaticamente PRIMEIRO
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      updated_at = NOW()
  WHERE id = NEW.id;
  
  RAISE WARNING '[AUTH_TRIGGER] Email confirmado automaticamente para: %', NEW.email;
  
  -- Extrair dados do metadata com segurança
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'fullName',
    split_part(NEW.email, '@', 1)
  );
  
  user_phone := COALESCE(
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'whatsapp',
    ''
  );
  
  user_cpf := NEW.raw_user_meta_data->>'cpf';
  
  -- Converter data de nascimento com tratamento de erro
  BEGIN
    IF NEW.raw_user_meta_data->>'birth_date' IS NOT NULL AND 
       NEW.raw_user_meta_data->>'birth_date' != '' THEN
      user_birth_date := (NEW.raw_user_meta_data->>'birth_date')::DATE;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      user_birth_date := NULL;
      RAISE WARNING '[AUTH_TRIGGER] Erro ao converter birth_date: %', NEW.raw_user_meta_data->>'birth_date';
  END;
  
  -- Inserir na tabela poupeja_users com tratamento de conflito
  INSERT INTO public.poupeja_users (
    id, 
    email, 
    name, 
    phone, 
    cpf,
    birth_date,
    created_at, 
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    user_name,
    user_phone,
    user_cpf,
    user_birth_date,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, poupeja_users.name),
    phone = COALESCE(EXCLUDED.phone, poupeja_users.phone),
    cpf = COALESCE(EXCLUDED.cpf, poupeja_users.cpf),
    birth_date = COALESCE(EXCLUDED.birth_date, poupeja_users.birth_date),
    updated_at = NOW();
  
  RAISE WARNING '[AUTH_TRIGGER] ✅ Usuário processado com sucesso: %', NEW.id;
  
  RETURN NEW;
  
EXCEPTION
  WHEN others THEN
    RAISE WARNING '[AUTH_TRIGGER] ❌ ERRO: % - SQLSTATE: %', SQLERRM, SQLSTATE;
    -- Não quebrar o signup, apenas logar o erro
    RETURN NEW;
END;
$function$;