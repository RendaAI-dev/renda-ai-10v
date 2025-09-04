-- Add unique constraint to CPF field to prevent duplicates
ALTER TABLE public.poupeja_users 
ADD CONSTRAINT unique_cpf_when_not_null 
EXCLUDE (cpf WITH =) WHERE (cpf IS NOT NULL AND cpf != '');

-- Add index for better performance on CPF lookups
CREATE INDEX idx_poupeja_users_cpf ON public.poupeja_users (cpf) WHERE cpf IS NOT NULL AND cpf != '';