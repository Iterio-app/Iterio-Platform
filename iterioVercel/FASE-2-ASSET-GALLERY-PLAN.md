# 🚀 Fase 2: Asset Gallery - Plan de implementación completo

## 🎯 Objetivo

Implementar una galería de assets reutilizables para reducir storage y mejorar UX, preparada para multi-agencia.

**Beneficios:**
- ✅ Reducción de storage en 90%+ (deduplicación)
- ✅ UX mejorada (elegir de galería vs subir cada vez)
- ✅ Consistencia de branding
- ✅ Preparado para multi-agencia desde el inicio
- ✅ Escalable sin costo adicional

---

## 📊 Proyección de ahorro

### Sin Asset Gallery:
- 3 agencias × 250 cotizaciones/mes × 5 imágenes = 3,750 imágenes/mes
- ~562 MB/mes → ~6.7 GB/año

### Con Asset Gallery:
- Catálogo inicial: ~200 assets únicos
- Crecimiento: +20-30 assets/mes
- **~30 MB/mes → ~360 MB/año** 🔥

**Ahorro: 95% de storage**

---

## 🏗️ Arquitectura

### **Estructura de Storage:**

```
quote-images/                          (bucket público)
  catalog/                             (assets reutilizables)
    {agencyId}/
      hotels/
        {timestamp}-{randomId}.webp
        {timestamp}-{randomId}.webp
      transfers/
        {timestamp}-{randomId}.webp
      services/
        {timestamp}-{randomId}.webp
      flights/
        {timestamp}-{randomId}.webp
      cruises/
        {timestamp}-{randomId}.webp
  
  quotes/                              (imágenes custom por cotización)
    {agencyId}/
      {userId}/
        {quoteId}/
          custom-{timestamp}.webp      (solo si no está en catálogo)
  
  tmp/                                 (temporales, se limpian semanalmente)
    {userId}/
      {randomId}.webp
```

### **Tabla `assets` en Supabase:**

```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL,              -- Preparado para multi-agencia
  user_id UUID NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('hotels', 'transfers', 'services', 'flights', 'cruises', 'other')),
  name TEXT NOT NULL,
  description TEXT,
  storage_url TEXT NOT NULL UNIQUE,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assets_agency_category ON assets(agency_id, category);
```

**Nota:** Aunque aún no tengas la tabla `agencies`, usaremos `agency_id` desde ahora. Por ahora puede ser un valor fijo (ej: `'default-agency'`), y cuando implementes multi-agencia, ya estará todo preparado.

---

## 📋 Plan de implementación (paso por paso)

### **PASO 0: Preparación** ⏱️ 2 min
- [ ] Leer este documento completo
- [ ] Tener Supabase Dashboard abierto
- [ ] Tener VS Code abierto

---

### **PASO 0.5: Implementar Multi-agencia Backend** ⏱️ 2h

**IMPORTANTE:** Antes de implementar Asset Gallery, implementar la estructura completa de multi-agencia a nivel backend.

**¿Por qué hacerlo ahora?**
- ✅ Evita migraciones complejas después
- ✅ Asset Gallery ya funciona con agencias desde día 1
- ✅ Quotes, templates y assets correctamente relacionados
- ✅ RLS configurado correctamente

**Pasos:**
1. Crear tabla `agencies`
2. Crear tabla `agency_members`
3. Migrar `quotes` con `agency_id`
4. Migrar `templates` con `agency_id`
5. Crear helpers TypeScript
6. Actualizar hooks existentes

**Ver plan detallado:** `FASE-2-MULTIAGENCIA-BACKEND.md`

**Tiempo estimado:** 2 horas

✅ **Checkpoint:** Multi-agencia backend implementado

---

### **PASO 1: Crear bucket en Supabase** ⏱️ 5 min

#### 1.1 Crear bucket
1. Ve a Supabase Dashboard → Storage
2. Click "Create a new bucket"
3. Configuración:
   - **Name:** `quote-images`
   - **Public:** ✅ **Activar** (para URLs públicas)
   - **File size limit:** 5 MB (opcional)
   - **Allowed MIME types:** `image/*` (opcional)
4. Click "Create bucket"

#### 1.2 Configurar políticas de acceso

Ve a Storage → `quote-images` → Policies → New Policy

**Opción A: Usar el editor visual**
- Policy 1: "Users can upload images"
  - Operation: INSERT
  - Target roles: authenticated
  - WITH CHECK: `bucket_id = 'quote-images'`

- Policy 2: "Public can view images"
  - Operation: SELECT
  - Target roles: public
  - USING: `bucket_id = 'quote-images'`

- Policy 3: "Users can delete their images"
  - Operation: DELETE
  - Target roles: authenticated
  - USING: `bucket_id = 'quote-images'`

**Opción B: Usar SQL (más rápido)**

```sql
-- En SQL Editor de Supabase
CREATE POLICY "Users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'quote-images');

CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'quote-images');

CREATE POLICY "Users can delete their images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'quote-images');
```

#### 1.3 Probar bucket
1. Sube una imagen de prueba manualmente desde el Dashboard
2. Copia la URL pública
3. Ábrela en una pestaña nueva → debe mostrarse
4. Elimina la imagen de prueba

✅ **Checkpoint:** Bucket creado y funcionando

---

### **PASO 2: Crear tabla `assets`** ⏱️ 5 min

#### 2.1 Crear tabla

En Supabase → SQL Editor → New Query:

```sql
-- Crear tabla de assets
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id TEXT NOT NULL DEFAULT 'default-agency',  -- Por ahora texto, luego será UUID
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('hotels', 'transfers', 'services', 'flights', 'cruises', 'other')),
  name TEXT NOT NULL,
  description TEXT,
  storage_url TEXT NOT NULL UNIQUE,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX idx_assets_agency_category ON assets(agency_id, category);
CREATE INDEX idx_assets_user ON assets(user_id);
CREATE INDEX idx_assets_created ON assets(created_at DESC);

-- Comentarios
COMMENT ON TABLE assets IS 'Galería de assets reutilizables por agencia';
COMMENT ON COLUMN assets.agency_id IS 'ID de la agencia (preparado para multi-agencia)';
COMMENT ON COLUMN assets.category IS 'Categoría del asset: hotels, transfers, services, flights, cruises, other';
```

#### 2.2 Configurar RLS (Row Level Security)

```sql
-- Habilitar RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios pueden ver assets de su agencia
CREATE POLICY "Users can view their agency assets"
ON assets FOR SELECT
TO authenticated
USING (true);  -- Por ahora todos ven todo, luego filtraremos por agency_id

-- Política: Usuarios pueden insertar assets
CREATE POLICY "Users can insert assets"
ON assets FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Política: Usuarios pueden actualizar sus assets
CREATE POLICY "Users can update their assets"
ON assets FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Política: Usuarios pueden eliminar sus assets
CREATE POLICY "Users can delete their assets"
ON assets FOR DELETE
TO authenticated
USING (user_id = auth.uid());
```

#### 2.3 Verificar tabla

```sql
-- Verificar que la tabla existe
SELECT * FROM assets LIMIT 1;
```

✅ **Checkpoint:** Tabla `assets` creada con RLS

---

### **PASO 3: Crear helpers de Storage** ⏱️ 15 min

#### 3.1 Crear archivo `lib/asset-helpers.ts`

Este archivo contendrá todas las funciones para manejar assets.

**Funciones a implementar:**
- `uploadAsset()` - Subir asset a catálogo
- `listAssets()` - Listar assets por categoría
- `deleteAsset()` - Eliminar asset
- `compressImage()` - Comprimir imagen antes de subir
- Helper types y constantes

#### 3.2 Actualizar tipos en `lib/supabase.ts`

Agregar tipo `Asset` a las exportaciones.

✅ **Checkpoint:** Helpers creados y probados

---

### **PASO 4: Crear componente AssetGallery** ⏱️ 2h

#### 4.1 Crear `components/asset-gallery.tsx`

Componente modal con:
- Grid de imágenes
- Búsqueda por nombre
- Filtro por categoría
- Selección múltiple
- Botón "Subir nueva"
- Preview de seleccionadas

#### 4.2 Crear `components/asset-card.tsx` (opcional)

Componente reutilizable para mostrar cada asset en el grid.

✅ **Checkpoint:** Componente AssetGallery funcional

---

### **PASO 5: Integrar en todas las secciones** ⏱️ 1.5h

Modificar estos componentes para agregar botón "Galería":

#### 5.1 FlightsSection
- Categoría: `'flights'`
- Uso: Bajo (pero disponible)

#### 5.2 AccommodationsSection
- Categoría: `'hotels'`
- Uso: **Alto** (se reutiliza mucho)

#### 5.3 TransfersSection
- Categoría: `'transfers'`
- Uso: **Alto** (se reutiliza mucho)

#### 5.4 ServicesSection
- Categoría: `'services'`
- Uso: **Medio-Alto**

#### 5.5 CruiseSection
- Categoría: `'cruises'`
- Uso: **Medio**

**Patrón de integración en cada sección:**

```typescript
// 1. Agregar estado
const [showGallery, setShowGallery] = useState(false)

// 2. Agregar botones
<div className="flex gap-2">
  <Button
    type="button"
    variant="outline"
    onClick={() => setShowGallery(true)}
  >
    📁 Galería
  </Button>
  <Button type="button" variant="outline" asChild>
    <label>
      📤 Subir
      <input type="file" className="hidden" onChange={handleUpload} />
    </label>
  </Button>
</div>

// 3. Agregar modal
<AssetGallery
  open={showGallery}
  onClose={() => setShowGallery(false)}
  agencyId="default-agency"  // Por ahora fijo, luego user.agency_id
  userId={user.id}
  category="hotels"  // Cambiar según sección
  onSelect={(urls) => {
    setImagenes([...imagenes, ...urls])
  }}
/>
```

✅ **Checkpoint:** Asset Gallery integrada en todas las secciones

---

### **PASO 6: Modificar flujo de guardado** ⏱️ 30 min

#### 6.1 Actualizar `hooks/use-quotes.ts`

Modificar `saveQuote` y `updateQuote` para:
- Guardar URLs (de catálogo o custom) en lugar de base64
- Mantener compatibilidad con cotizaciones viejas (base64)

#### 6.2 Crear helper de compatibilidad

```typescript
// lib/image-helpers.ts
export function isStorageUrl(str: string): boolean {
  return str.startsWith('http') && str.includes('quote-images')
}

export function isBase64(str: string): boolean {
  return str.startsWith('data:image')
}

export function isCatalogAsset(url: string): boolean {
  return url.includes('/catalog/')
}
```

✅ **Checkpoint:** Guardado funciona con URLs

---

### **PASO 7: Testing completo** ⏱️ 30 min

#### 7.1 Test de subida a catálogo
- [ ] Subir imagen a galería de hoteles
- [ ] Verificar que aparece en Storage bajo `catalog/default-agency/hotels/`
- [ ] Verificar que aparece en tabla `assets`
- [ ] Verificar que se muestra en la galería

#### 7.2 Test de uso en cotización
- [ ] Crear nueva cotización
- [ ] Abrir galería en sección de alojamientos
- [ ] Seleccionar imagen del catálogo
- [ ] Guardar cotización
- [ ] Verificar que la URL se guardó correctamente
- [ ] Abrir cotización → verificar que imagen se muestra

#### 7.3 Test de eliminación
- [ ] Eliminar asset de la galería
- [ ] Verificar que se eliminó de Storage
- [ ] Verificar que se eliminó de tabla `assets`
- [ ] Verificar que NO se muestra en galería

#### 7.4 Test de búsqueda
- [ ] Buscar asset por nombre
- [ ] Verificar que filtra correctamente

#### 7.5 Test de categorías
- [ ] Probar en cada sección (vuelos, hoteles, traslados, servicios, cruceros)
- [ ] Verificar que cada una muestra solo sus assets

✅ **Checkpoint:** Todo funciona correctamente

---

### **PASO 8: Optimizaciones opcionales** ⏱️ 1h (opcional)

#### 8.1 Compresión de imágenes
- Implementar compresión en cliente antes de subir
- Librería: `browser-image-compression`
- Target: 150KB, 1200px max width, WebP

#### 8.2 Paginación en galería
- Si hay >50 assets, implementar paginación

#### 8.3 Drag & drop
- Permitir arrastrar imágenes para subir

#### 8.4 Bulk upload
- Subir múltiples imágenes a la vez

✅ **Checkpoint:** Optimizaciones implementadas

---

### **PASO 9: Preparación para multi-agencia** ⏱️ 15 min

#### 9.1 Crear helper de agency_id

```typescript
// lib/agency-helpers.ts
export function getCurrentAgencyId(user: User): string {
  // Por ahora retorna 'default-agency'
  // Cuando implementes multi-agencia, retornará user.agency_id
  return user.agency_id || 'default-agency'
}
```

#### 9.2 Actualizar todos los componentes

Reemplazar `"default-agency"` por `getCurrentAgencyId(user)`

#### 9.3 Documentar migración futura

Crear `MULTI-AGENCIA-MIGRATION.md` con pasos para cuando implementes multi-agencia.

✅ **Checkpoint:** Preparado para multi-agencia

---

### **PASO 10: Limpieza y documentación** ⏱️ 15 min

#### 10.1 Limpiar código
- Eliminar console.logs innecesarios
- Agregar comentarios donde sea necesario
- Verificar tipos TypeScript

#### 10.2 Actualizar README
- Documentar nueva feature de Asset Gallery
- Agregar screenshots

#### 10.3 Crear guía de usuario
- Cómo usar la galería
- Mejores prácticas

✅ **Checkpoint:** Documentación completa

---

## 📁 Archivos a crear/modificar

### **Nuevos archivos:**
- ✅ `lib/asset-helpers.ts` - Helpers de assets
- ✅ `lib/image-helpers.ts` - Helpers de imágenes
- ✅ `lib/agency-helpers.ts` - Helpers de agencia
- ✅ `components/asset-gallery.tsx` - Modal de galería
- ✅ `components/asset-card.tsx` - Card de asset (opcional)

### **Archivos a modificar:**
- ✅ `lib/supabase.ts` - Agregar tipo Asset
- ✅ `hooks/use-quotes.ts` - Actualizar guardado
- ✅ `components/flights-section.tsx` - Integrar galería
- ✅ `components/accommodations-section.tsx` - Integrar galería
- ✅ `components/transfers-section.tsx` - Integrar galería
- ✅ `components/services-section.tsx` - Integrar galería
- ✅ `components/cruise-section.tsx` - Integrar galería

---

## ⏱️ Tiempo total estimado

| Paso | Tiempo | Acumulado |
|------|--------|-----------|
| 0. Preparación | 2 min | 2 min |
| 1. Crear bucket | 5 min | 7 min |
| 2. Crear tabla | 5 min | 12 min |
| 3. Helpers | 15 min | 27 min |
| 4. AssetGallery | 2h | 2h 27min |
| 5. Integración | 1.5h | 3h 57min |
| 6. Guardado | 30 min | 4h 27min |
| 7. Testing | 30 min | 4h 57min |
| 8. Optimizaciones | 1h (opcional) | 5h 57min |
| 9. Multi-agencia | 15 min | 6h 12min |
| 10. Limpieza | 15 min | 6h 27min |

**Total: 4-6 horas** (sin optimizaciones opcionales)

---

## ✅ Checklist final

### **Funcionalidad básica:**
- [ ] Bucket `quote-images` creado y configurado
- [ ] Tabla `assets` creada con RLS
- [ ] Helpers de assets funcionando
- [ ] Componente AssetGallery funcional
- [ ] Integrado en las 5 secciones
- [ ] Guardado funciona con URLs
- [ ] Testing completo pasado

### **Preparación multi-agencia:**
- [ ] Estructura usa `agency_id` en todo
- [ ] Helper `getCurrentAgencyId()` implementado
- [ ] Documentación de migración futura

### **Optimizaciones:**
- [ ] Compresión de imágenes (opcional)
- [ ] Paginación (opcional)
- [ ] Drag & drop (opcional)

---

## 🎯 Próximos pasos

Una vez completada esta implementación:

1. **Monitorear Storage:**
   - Ver crecimiento real
   - Ajustar límites si es necesario

2. **Feedback de usuarios:**
   - ¿Qué categorías se usan más?
   - ¿Qué features faltan?

3. **Implementar multi-agencia:**
   - Crear tabla `agencies`
   - Migrar `agency_id` de TEXT a UUID
   - Actualizar RLS policies

4. **Optimizaciones futuras:**
   - Cleanup automático de assets no usados
   - Analytics de uso
   - Bulk operations

---

## 📝 Notas importantes

### **Compatibilidad hacia atrás:**
- Las cotizaciones viejas con base64 seguirán funcionando
- Los helpers detectan automáticamente si es URL o base64
- No necesitas migrar cotizaciones existentes (opcional)

### **Multi-agencia:**
- Todo está preparado desde el inicio
- Solo necesitas cambiar `'default-agency'` por `user.agency_id`
- Las políticas RLS ya están listas

### **Storage gratuito:**
- Con esta implementación, deberías mantenerte en el plan free
- Monitorea el uso mensual
- Si creces mucho, considera cleanup automático

---

## 🚀 ¿Listo para empezar?

En el próximo prompt, empezaremos con el **Paso 1: Crear bucket en Supabase**.

Dime cuando estés listo y te guío paso por paso. 🎯
