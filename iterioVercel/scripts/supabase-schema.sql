-- Configuración inicial de Supabase para el sistema de cotizaciones

-- Crear tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  agency_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user',
  is_approved BOOLEAN DEFAULT false,
  is_rejected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Crear tabla para cotizaciones guardadas
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  destination TEXT,
  year TEXT,
  client_name TEXT,
  client_data JSONB,
  flights_data JSONB,
  accommodations_data JSONB,
  transfers_data JSONB,
  services_data JSONB,
  summary_data JSONB,
  template_data JSONB,
  status TEXT DEFAULT 'draft',
  total_amount DECIMAL(10,2) DEFAULT 0,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Crear nuevas políticas para profiles
CREATE POLICY "Enable read access for all users" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on id" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR 
    (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Enable insert for users based on id" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para quotes
CREATE POLICY "Users can view own quotes" ON public.quotes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quotes" ON public.quotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quotes" ON public.quotes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quotes" ON public.quotes
  FOR DELETE USING (auth.uid() = user_id);

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    role,
    is_approved,
    is_rejected
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    COALESCE((NEW.raw_user_meta_data->>'is_approved')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'is_rejected')::boolean, false)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar la función cuando se crea un nuevo usuario
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON public.quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_approval ON public.profiles(is_approved, is_rejected);

-- Comentarios para documentación
COMMENT ON TABLE public.profiles IS 'Perfiles de usuario extendidos con roles y aprobación';
COMMENT ON TABLE public.quotes IS 'Cotizaciones guardadas por los usuarios';
COMMENT ON COLUMN public.profiles.template_config IS 'Configuración personalizada del template PDF del usuario';
COMMENT ON COLUMN public.quotes.status IS 'Estado de la cotización: draft, completed, sent';
COMMENT ON COLUMN public.quotes.total_amount IS 'Monto total de la cotización';
COMMENT ON COLUMN public.quotes.client_name IS 'Nombre del cliente para búsqueda rápida';
COMMENT ON COLUMN public.quotes.pdf_url IS 'URL del PDF generado';

-- Set up realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
