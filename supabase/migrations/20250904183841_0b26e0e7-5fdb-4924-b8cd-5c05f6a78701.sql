-- Atualizar a função trigger para processar campos de endereço
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_name TEXT;
  user_phone TEXT;
  user_cpf TEXT;
  user_birth_date DATE;
  user_street TEXT;
  user_number TEXT;
  user_complement TEXT;
  user_neighborhood TEXT;
  user_city TEXT;
  user_state TEXT;
  user_zip_code TEXT;
BEGIN
  -- Log detalhado
  RAISE WARNING '[AUTH_TRIGGER] Usuário criado no auth.users - ID: %, Email: %', NEW.id, NEW.email;
  
  -- Confirmar email automaticamente PRIMEIRO
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      updated_at = NOW()
  WHERE id = NEW.id;
  
  RAISE WARNING '[AUTH_TRIGGER] Email confirmado automaticamente para: %', NEW.email;
  
  -- Extrair dados pessoais do metadata
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
  
  -- Extrair dados de endereço do metadata
  user_street := NEW.raw_user_meta_data->>'street';
  user_number := NEW.raw_user_meta_data->>'number';
  user_complement := NEW.raw_user_meta_data->>'complement';
  user_neighborhood := NEW.raw_user_meta_data->>'neighborhood';
  user_city := NEW.raw_user_meta_data->>'city';
  user_state := NEW.raw_user_meta_data->>'state';
  user_zip_code := NEW.raw_user_meta_data->>'zip_code';
  
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
    street,
    number,
    complement,
    neighborhood,
    city,
    state,
    zip_code,
    created_at, 
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    user_name,
    user_phone,
    user_cpf,
    user_birth_date,
    user_street,
    user_number,
    user_complement,
    user_neighborhood,
    user_city,
    user_state,
    user_zip_code,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, poupeja_users.name),
    phone = COALESCE(EXCLUDED.phone, poupeja_users.phone),
    cpf = COALESCE(EXCLUDED.cpf, poupeja_users.cpf),
    birth_date = COALESCE(EXCLUDED.birth_date, poupeja_users.birth_date),
    street = COALESCE(EXCLUDED.street, poupeja_users.street),
    number = COALESCE(EXCLUDED.number, poupeja_users.number),
    complement = COALESCE(EXCLUDED.complement, poupeja_users.complement),
    neighborhood = COALESCE(EXCLUDED.neighborhood, poupeja_users.neighborhood),
    city = COALESCE(EXCLUDED.city, poupeja_users.city),
    state = COALESCE(EXCLUDED.state, poupeja_users.state),
    zip_code = COALESCE(EXCLUDED.zip_code, poupeja_users.zip_code),
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