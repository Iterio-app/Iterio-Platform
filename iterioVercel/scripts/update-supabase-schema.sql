-- Actualizar tabla de perfiles para incluir configuración de template
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS template_config JSONB DEFAULT '{
  "primaryColor": "#2563eb",
  "secondaryColor": "#64748b", 
  "fontFamily": "Inter",
  "logo": null,
  "agencyName": "Tu Agencia de Viajes",
  "agencyAddress": "Dirección de la agencia",
  "agencyPhone": "+1 234 567 8900",
  "agencyEmail": "info@tuagencia.com",
  "validityText": "Esta cotización es válida por 15 días desde la fecha de emisión."
}'::jsonb;

-- Actualizar tabla de cotizaciones con más campos útiles
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON public.quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);

-- Comentarios actualizados
COMMENT ON COLUMN public.profiles.template_config IS 'Configuración personalizada del template PDF del usuario';
COMMENT ON COLUMN public.quotes.status IS 'Estado de la cotización: draft, completed, sent';
COMMENT ON COLUMN public.quotes.total_amount IS 'Monto total de la cotización';
COMMENT ON COLUMN public.quotes.client_name IS 'Nombre del cliente para búsqueda rápida';
COMMENT ON COLUMN public.quotes.pdf_url IS 'URL del PDF generado (si se guarda)';
