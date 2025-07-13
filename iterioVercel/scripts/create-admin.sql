-- Actualizar el perfil del usuario a admin

UPDATE public.profiles
SET 
  role = 'admin',
  is_approved = true,
  is_rejected = false,
  full_name = 'Administrador Principal'
WHERE email = 'lscalise@itba.edu.ar';

-- Verificar que el usuario fue actualizado correctamente
SELECT id, email, role, is_approved, is_rejected
FROM public.profiles
WHERE email = 'lscalise@itba.edu.ar'; 