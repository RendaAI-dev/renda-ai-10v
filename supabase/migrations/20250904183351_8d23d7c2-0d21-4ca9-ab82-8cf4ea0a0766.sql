-- Add unique constraint to CPF field (only when CPF is not null and not empty)
CREATE UNIQUE INDEX IF NOT EXISTS unique_cpf_not_null ON public.poupeja_users (cpf) 
WHERE cpf IS NOT NULL AND cpf != '';