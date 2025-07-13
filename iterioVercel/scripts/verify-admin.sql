-- Verificar y actualizar el rol de admin para el usuario específico
UPDATE public.profiles 
SET role = 'admin'
WHERE email = 'lscalise@itba.edu.ar'
RETURNING id, email, role;

-- Verificar que las políticas estén activas
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles'; 