-- Primero, desactivar temporalmente RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for users based on id" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for users based on email" ON public.profiles;

-- Crear nuevas políticas más permisivas
CREATE POLICY "Enable read access for all users" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for service role" ON public.profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for users and admins" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Reactivar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY; 