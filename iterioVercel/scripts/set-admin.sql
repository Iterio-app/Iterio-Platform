-- Establecer el usuario como admin
UPDATE public.profiles
SET 
  role = 'admin',
  is_approved = true
WHERE email = 'lscalise@itba.edu.ar';

-- Verificar el cambio
SELECT id, email, role, is_approved
FROM public.profiles
WHERE email = 'lscalise@itba.edu.ar'; 