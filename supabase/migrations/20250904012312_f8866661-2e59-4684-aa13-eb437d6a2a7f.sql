-- Add CPF and birth_date columns to poupeja_users table
ALTER TABLE public.poupeja_users 
ADD COLUMN cpf TEXT,
ADD COLUMN birth_date DATE;

-- Create index on CPF for faster lookups (optional but good for performance)
CREATE INDEX idx_poupeja_users_cpf ON public.poupeja_users(cpf) WHERE cpf IS NOT NULL;

-- Update the handle_auth_user_created function to process CPF and birth_date
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
  RAISE WARNING '[AUTH_TRIGGER] Raw metadata: %', NEW.raw_user_meta_data;
  
  -- Extrair dados do metadata com múltiplas opções
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'fullName',
    ''
  );
  
  user_phone := COALESCE(
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'whatsapp',
    ''
  );
  
  -- Extrair CPF e data de nascimento
  user_cpf := NEW.raw_user_meta_data->>'cpf';
  
  -- Converter string de data para DATE se presente
  BEGIN
    IF NEW.raw_user_meta_data->>'birth_date' IS NOT NULL THEN
      user_birth_date := (NEW.raw_user_meta_data->>'birth_date')::DATE;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      user_birth_date := NULL;
      RAISE WARNING '[AUTH_TRIGGER] Erro ao converter birth_date: %', NEW.raw_user_meta_data->>'birth_date';
  END;
  
  RAISE WARNING '[AUTH_TRIGGER] Dados processados - Nome: "%", Telefone: "%", CPF: "%", Nascimento: "%"', user_name, user_phone, user_cpf, user_birth_date;
  
  -- Confirmar email automaticamente
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id;
  
  RAISE WARNING '[AUTH_TRIGGER] Email confirmado automaticamente';
  
  -- Inserir na tabela poupeja_users
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
  );
  
  RAISE WARNING '[AUTH_TRIGGER] ✅ SUCESSO - Usuário inserido em poupeja_users: %', NEW.id;
  
  RETURN NEW;
  
EXCEPTION
  WHEN unique_violation THEN
    RAISE WARNING '[AUTH_TRIGGER] ⚠️ Usuário já existe na poupeja_users: %', NEW.id;
    RETURN NEW;
  WHEN others THEN
    RAISE WARNING '[AUTH_TRIGGER] ❌ ERRO CRÍTICO: % - %', SQLERRM, SQLSTATE;
    RAISE WARNING '[AUTH_TRIGGER] Dados que falharam: ID=%, Email=%, Nome=%, Phone=%, CPF=%, Birth="%"', NEW.id, NEW.email, user_name, user_phone, user_cpf, user_birth_date;
    RETURN NEW; -- Não quebrar o signup
END;
$function$;