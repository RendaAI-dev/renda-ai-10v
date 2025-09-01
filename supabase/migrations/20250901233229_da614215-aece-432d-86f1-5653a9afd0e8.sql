-- Clean up trailing spaces in evolution config
UPDATE public.poupeja_evolution_config 
SET 
  instance_name = TRIM(instance_name),
  api_url = TRIM(api_url),
  updated_at = NOW()
WHERE 
  instance_name != TRIM(instance_name) 
  OR api_url != TRIM(api_url);