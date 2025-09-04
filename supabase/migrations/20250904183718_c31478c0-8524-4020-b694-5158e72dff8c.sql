-- Adicionar campos de endereço à tabela poupeja_users
ALTER TABLE public.poupeja_users 
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS number TEXT,
ADD COLUMN IF NOT EXISTS complement TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Por enquanto, não vamos alterar CPF para NOT NULL para usuários existentes
-- Em vez disso, vamos criar uma constraint que valida novos registros

-- Adicionar comentários para documentar os campos
COMMENT ON COLUMN public.poupeja_users.street IS 'Rua/Avenida do endereço do usuário';
COMMENT ON COLUMN public.poupeja_users.number IS 'Número do endereço';
COMMENT ON COLUMN public.poupeja_users.complement IS 'Complemento do endereço (opcional)';
COMMENT ON COLUMN public.poupeja_users.neighborhood IS 'Bairro';
COMMENT ON COLUMN public.poupeja_users.city IS 'Cidade';
COMMENT ON COLUMN public.poupeja_users.state IS 'Estado (UF)';
COMMENT ON COLUMN public.poupeja_users.zip_code IS 'CEP (Código de Endereçamento Postal)';

-- Criar índices para melhorar performance em consultas por localização
CREATE INDEX IF NOT EXISTS idx_poupeja_users_city ON public.poupeja_users(city);
CREATE INDEX IF NOT EXISTS idx_poupeja_users_state ON public.poupeja_users(state);
CREATE INDEX IF NOT EXISTS idx_poupeja_users_zip_code ON public.poupeja_users(zip_code);