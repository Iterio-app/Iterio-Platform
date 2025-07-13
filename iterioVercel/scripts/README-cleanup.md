# Limpieza de template_config - Desarrollo

## 📋 Resumen

Limpieza simple para eliminar la columna `template_config` redundante de la tabla `profiles` en ambiente de desarrollo.

## 🎯 Objetivo

Eliminar la duplicación de datos entre `profiles.template_config` y la tabla `templates` para mejorar la normalización de la base de datos.

## 🚀 Pasos de Limpieza

### Paso 1: Verificar que estás en desarrollo
```sql
-- Confirmar que no hay datos importantes en profiles.template_config
SELECT COUNT(*) as usuarios_con_template_config
FROM public.profiles 
WHERE template_config IS NOT NULL AND template_config != '{}';
```

### Paso 2: Ejecutar limpieza
```sql
-- Ejecutar en Supabase SQL Editor
\i scripts/cleanup-template-config.sql
```

### Paso 3: Verificar limpieza
```sql
-- Confirmar que la columna fue eliminada
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'template_config';
```

## 📝 Cambios en el Código

### Archivos Actualizados:
1. **`lib/supabase.ts`** - Eliminada interfaz `template_config` de `Profile`
2. **`hooks/use-templates.ts`** - Nuevo hook unificado
3. **`app/page.tsx`** - Actualizado para usar nuevo hook
4. **`hooks/use-template-config.ts`** - Deprecado (eliminar manualmente)

### Nuevas Funcionalidades:
- ✅ Gestión unificada de templates
- ✅ Auto-guardado mejorado
- ✅ Mejor manejo de errores
- ✅ Tipos TypeScript más consistentes

## 🧹 Limpieza Manual Adicional

### Eliminar archivo deprecado:
```bash
rm hooks/use-template-config.ts
```

### Verificar que no hay referencias:
```bash
grep -r "useTemplateConfig" .
grep -r "template_config" .
```

## ✅ Verificación Final

1. **Base de datos**: Columna `template_config` eliminada
2. **Código**: Usando `useTemplates` en lugar de `useTemplateConfig`
3. **Funcionalidad**: Templates funcionando correctamente
4. **PDFs**: Generación sin errores

## 🎉 Beneficios Obtenidos

- ✅ **Normalización**: Datos en una sola tabla
- ✅ **Consistencia**: Un solo lugar para templates
- ✅ **Mantenimiento**: Código más limpio
- ✅ **Rendimiento**: Menos consultas redundantes
- ✅ **Escalabilidad**: Fácil agregar funcionalidades

## 🔗 Referencias

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Normalization](https://en.wikipedia.org/wiki/Database_normalization) 