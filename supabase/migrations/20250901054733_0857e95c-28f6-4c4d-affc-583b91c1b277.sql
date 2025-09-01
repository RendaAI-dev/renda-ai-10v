-- Grant admin access to the current test user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE email = 'fernando.c123.456@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;