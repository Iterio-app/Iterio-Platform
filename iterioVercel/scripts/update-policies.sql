-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for users based on id" ON public.profiles;

-- Crear nuevas políticas para profiles
CREATE POLICY "Enable read access for all users" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for users based on email" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.jwt() IS NULL OR  -- Permitir inserciones durante el registro
    auth.uid() = id
  );

CREATE POLICY "Enable update for users based on id" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR 
    (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid())
  ); 