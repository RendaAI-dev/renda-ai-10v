-- Add unique constraint to CPF field to prevent duplicates
ALTER TABLE public.poupeja_users 
ADD CONSTRAINT unique_cpf UNIQUE (cpf);

-- Create index for better performance on CPF lookups
CREATE INDEX idx_poupeja_users_cpf ON public.poupeja_users(cpf);