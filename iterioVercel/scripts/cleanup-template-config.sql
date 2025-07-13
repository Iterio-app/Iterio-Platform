-- Script de limpieza: Eliminar template_config de profiles
-- Para uso en desarrollo/pre-producción donde no hay datos importantes

-- 1. Eliminar la columna template_config de profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS template_config;

-- 2. Actualizar comentarios de la tabla
COMMENT ON TABLE public.profiles IS 'Perfiles de usuario extendidos con roles y aprobación';
COMMENT ON TABLE public.templates IS 'Templates personalizados de PDF por usuario';

-- 3. Verificar que la limpieza fue exitosa
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'template_config') 
        THEN '❌ Columna template_config aún existe'
        ELSE '✅ Columna template_config eliminada exitosamente'
    END as status;

-- 4. Verificar que la tabla templates está lista
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'templates') 
        THEN '✅ Tabla templates lista para usar'
        ELSE '❌ Tabla templates no existe - Ejecutar create-templates-table.sql primero'
    END as status; 