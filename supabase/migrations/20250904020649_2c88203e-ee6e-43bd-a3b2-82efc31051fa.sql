-- First, let's clean up duplicate CPFs by setting them to NULL for duplicates (keeping the oldest record)
WITH duplicate_cpfs AS (
  SELECT cpf, MIN(created_at) as first_created
  FROM public.poupeja_users 
  WHERE cpf IS NOT NULL AND cpf != ''
  GROUP BY cpf 
  HAVING COUNT(*) > 1
)
UPDATE public.poupeja_users 
SET cpf = NULL
WHERE cpf IN (SELECT cpf FROM duplicate_cpfs)
  AND created_at NOT IN (
    SELECT first_created 
    FROM duplicate_cpfs 
    WHERE duplicate_cpfs.cpf = poupeja_users.cpf
  );

-- Now add the unique constraint
ALTER TABLE public.poupeja_users 
ADD CONSTRAINT unique_cpf UNIQUE (cpf);

-- Create index for better performance on CPF lookups
CREATE INDEX idx_poupeja_users_cpf ON public.poupeja_users(cpf) WHERE cpf IS NOT NULL;