-- Backup existing data if needed
CREATE TABLE IF NOT EXISTS profiles_backup AS SELECT * FROM public.profiles;

-- Drop existing table
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Recreate profiles table with correct structure
CREATE TABLE public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
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

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Restore existing data if any exists
INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    agency_name, 
    phone, 
    role, 
    is_approved, 
    is_rejected, 
    created_at, 
    updated_at
)
SELECT 
    id, 
    email, 
    full_name, 
    agency_name, 
    phone, 
    role, 
    is_approved, 
    is_rejected, 
    created_at, 
    updated_at
FROM profiles_backup
ON CONFLICT (id) DO NOTHING;

-- Recreate policies
CREATE POLICY "Enable read access for all users" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on id" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR 
    (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Enable insert for users based on id" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Set up realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Clean up backup if everything is OK
-- DROP TABLE IF EXISTS profiles_backup; 