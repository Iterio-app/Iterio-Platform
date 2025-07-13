// Script para configurar Supabase
console.log("🚀 Configurando Supabase para autenticación...")

console.log(`
📋 PASOS PARA CONFIGURAR SUPABASE:

1. Ve a https://supabase.com y crea una cuenta gratuita
2. Crea un nuevo proyecto
3. Ve a Settings > API
4. Copia las siguientes variables:
   - Project URL
   - anon public key

5. Crea un archivo .env.local en la raíz del proyecto con:
   NEXT_PUBLIC_SUPABASE_URL=tu_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key

6. Ve a Authentication > Settings y configura:
   - Site URL: http://localhost:3000 (para desarrollo)
   - Redirect URLs: http://localhost:3000/auth/callback

7. Ejecuta las migraciones SQL que se encuentran en scripts/supabase-schema.sql

¡Una vez hecho esto, tendrás autenticación completa con Supabase! 🎉
`)

console.log("✅ Instrucciones mostradas. Sigue los pasos para completar la configuración.")
