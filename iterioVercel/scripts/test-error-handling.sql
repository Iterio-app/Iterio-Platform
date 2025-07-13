-- Script para probar el manejo de errores de templates
-- Ejecutar en Supabase SQL Editor para verificar que las validaciones funcionan

-- 1. Probar inserción con datos inválidos (debería fallar)
-- Esto probará las validaciones de la base de datos
INSERT INTO public.templates (user_id, name, template_data) VALUES 
('00000000-0000-0000-0000-000000000000', '', '{}');

-- 2. Probar inserción con nombre duplicado (debería fallar si ya existe)
-- Primero crear uno válido
INSERT INTO public.templates (user_id, name, template_data) VALUES 
('00000000-0000-0000-0000-000000000000', 'Test Template', '{"primaryColor": "#ff0000"}');

-- Luego intentar crear otro con el mismo nombre (debería fallar)
INSERT INTO public.templates (user_id, name, template_data) VALUES 
('00000000-0000-0000-0000-000000000000', 'Test Template', '{"primaryColor": "#00ff00"}');

-- 3. Probar actualización de template que no existe (debería fallar)
UPDATE public.templates 
SET name = 'Updated Name' 
WHERE id = '00000000-0000-0000-0000-000000000000';

-- 4. Probar eliminación de template que no existe (debería fallar)
DELETE FROM public.templates 
WHERE id = '00000000-0000-0000-0000-000000000000';

-- 5. Verificar que las políticas RLS funcionan
-- Intentar acceder a templates de otro usuario (debería fallar)
SELECT * FROM public.templates 
WHERE user_id != auth.uid();

-- 6. Limpiar datos de prueba
DELETE FROM public.templates 
WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- 7. Verificar que no hay datos de prueba
SELECT COUNT(*) as templates_de_prueba 
FROM public.templates 
WHERE user_id = '00000000-0000-0000-0000-000000000000'; 