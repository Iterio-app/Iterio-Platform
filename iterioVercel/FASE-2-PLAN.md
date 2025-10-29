# 🚀 Fase 2: Migrar imágenes a Storage - Plan de implementación

## 🎯 Objetivo

Migrar imágenes de JSONB (base64) a Supabase Storage (URLs)

**Beneficios:**
- Database: 270MB → ~15MB (-95%)
- Disk IO: -70%
- Egress de escritura: -70%
- Preparado para multi-agencia

---

## 📋 Pasos de implementación

### **Paso 1: Configurar Storage en Supabase** ✅
- Crear bucket para imágenes
- Configurar políticas de acceso
- Testing de subida/descarga

### **Paso 2: Crear helpers de Storage** ✅
- `uploadImage()` - Subir imagen y retornar URL
- `deleteImage()` - Eliminar imagen por URL
- `getImageUrl()` - Obtener URL pública
- Testing de helpers

### **Paso 3: Modificar componentes de carga (sin romper)** ✅
- Mantener funcionalidad actual
- Agregar lógica para subir a Storage
- Guardar URLs en lugar de base64
- Testing: crear cotización nueva

### **Paso 4: Modificar componentes de edición** ✅
- Cargar imágenes desde URLs
- Mantener compatibilidad con base64 (cotizaciones viejas)
- Testing: editar cotización

### **Paso 5: Migrar cotizaciones existentes** ✅
- Script de migración
- Backup antes de migrar
- Migración gradual
- Validación

### **Paso 6: Limpieza y optimización** ✅
- Eliminar código legacy de base64
- Optimizar queries
- Testing completo

---

## 🔧 Paso 1: Configurar Storage en Supabase

### **1.1 Crear bucket**

1. Ve a Supabase Dashboard
2. Storage → Create bucket
3. Nombre: `quote-images`
4. Public: ✅ (para que las URLs funcionen)

### **1.2 Configurar políticas**

```sql
-- Política: Usuarios autenticados pueden subir
CREATE POLICY "Users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'quote-images');

-- Política: Usuarios autenticados pueden ver sus imágenes
CREATE POLICY "Users can view their images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'quote-images');

-- Política: Usuarios autenticados pueden eliminar sus imágenes
CREATE POLICY "Users can delete their images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'quote-images');

-- Política: Acceso público para lectura
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'quote-images');
```

### **1.3 Testing**

Probar manualmente:
- Subir imagen desde Dashboard
- Ver URL pública
- Eliminar imagen

---

## 🔧 Paso 2: Crear helpers de Storage

### **Archivo: `lib/storage-helpers.ts`**

```typescript
import { supabase } from "./supabase"

const BUCKET_NAME = "quote-images"

/**
 * Subir imagen a Storage
 * @param file - File o base64 string
 * @param userId - ID del usuario
 * @param quoteId - ID de la cotización
 * @returns URL pública de la imagen
 */
export async function uploadImage(
  file: File | string,
  userId: string,
  quoteId: string
): Promise<string> {
  try {
    // Generar nombre único
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(7)
    const fileName = `${userId}/${quoteId}/${timestamp}-${randomId}`

    let fileToUpload: File | Blob

    // Si es base64, convertir a Blob
    if (typeof file === "string") {
      const base64Data = file.split(",")[1]
      const mimeType = file.split(";")[0].split(":")[1]
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      fileToUpload = new Blob([byteArray], { type: mimeType })
    } else {
      fileToUpload = file
    }

    // Subir a Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileToUpload, {
        cacheControl: "3600",
        upsert: false,
      })

    if (error) throw error

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path)

    console.log(`✅ Imagen subida: ${urlData.publicUrl}`)
    return urlData.publicUrl
  } catch (error: any) {
    console.error("Error al subir imagen:", error)
    throw error
  }
}

/**
 * Eliminar imagen de Storage
 * @param imageUrl - URL pública de la imagen
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // Extraer path de la URL
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split(`/${BUCKET_NAME}/`)
    if (pathParts.length < 2) {
      throw new Error("URL inválida")
    }
    const filePath = pathParts[1]

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (error) throw error

    console.log(`🗑️ Imagen eliminada: ${filePath}`)
  } catch (error: any) {
    console.error("Error al eliminar imagen:", error)
    // No lanzar error, solo logear (la imagen puede ya no existir)
  }
}

/**
 * Eliminar múltiples imágenes
 * @param imageUrls - Array de URLs
 */
export async function deleteImages(imageUrls: string[]): Promise<void> {
  const deletePromises = imageUrls.map((url) => deleteImage(url))
  await Promise.all(deletePromises)
}

/**
 * Verificar si una string es una URL de Storage o base64
 * @param imageString - String a verificar
 * @returns true si es URL de Storage
 */
export function isStorageUrl(imageString: string): boolean {
  return imageString.startsWith("http") && imageString.includes(BUCKET_NAME)
}

/**
 * Verificar si una string es base64
 * @param imageString - String a verificar
 * @returns true si es base64
 */
export function isBase64(imageString: string): boolean {
  return imageString.startsWith("data:image")
}
```

### **Testing del helper**

Crear archivo temporal `test-storage.ts`:

```typescript
import { uploadImage, deleteImage, isStorageUrl } from "./lib/storage-helpers"

// Test 1: Subir imagen base64
const testBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

async function testUpload() {
  const url = await uploadImage(testBase64, "test-user", "test-quote")
  console.log("URL generada:", url)
  console.log("Es Storage URL?", isStorageUrl(url))
  
  // Test 2: Eliminar imagen
  await deleteImage(url)
  console.log("Imagen eliminada")
}

testUpload()
```

---

## 🔧 Paso 3: Modificar componentes de carga

### **Estrategia: Compatibilidad hacia atrás**

Vamos a modificar los componentes para que:
1. ✅ Suban nuevas imágenes a Storage
2. ✅ Guarden URLs en lugar de base64
3. ✅ Sigan funcionando con cotizaciones viejas (base64)

### **3.1 Modificar FlightsSection**

Archivo: `components/flights-section.tsx`

Buscar donde se maneja la carga de imágenes y modificar:

```typescript
// ❌ ANTES
const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onloadend = () => {
      // Guardar base64
      setImagenes([...imagenes, reader.result as string])
    }
    reader.readAsDataURL(file)
  }
}

// ✅ DESPUÉS
import { uploadImage } from "@/lib/storage-helpers"

const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return
  
  try {
    setUploading(true)
    
    // Subir a Storage
    const imageUrl = await uploadImage(file, user.id, quoteId || "temp")
    
    // Guardar URL
    setImagenes([...imagenes, imageUrl])
    
    console.log("✅ Imagen subida a Storage:", imageUrl)
  } catch (error) {
    console.error("Error al subir imagen:", error)
    // Fallback a base64 si falla
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagenes([...imagenes, reader.result as string])
    }
    reader.readAsDataURL(file)
  } finally {
    setUploading(false)
  }
}
```

### **3.2 Repetir para otros componentes**

Aplicar el mismo patrón en:
- `components/accommodations-section.tsx`
- `components/transfers-section.tsx`
- `components/services-section.tsx`
- `components/cruise-section.tsx`

---

## 🔧 Paso 4: Modificar visualización de imágenes

### **4.1 Componente de imagen compatible**

Crear `components/quote-image.tsx`:

```typescript
import { isStorageUrl, isBase64 } from "@/lib/storage-helpers"

interface QuoteImageProps {
  src: string
  alt: string
  className?: string
}

export function QuoteImage({ src, alt, className }: QuoteImageProps) {
  // Manejar tanto URLs de Storage como base64
  const imageSrc = isStorageUrl(src) || isBase64(src) ? src : ""
  
  if (!imageSrc) {
    return <div className={className}>Imagen no disponible</div>
  }
  
  return (
    <img 
      src={imageSrc} 
      alt={alt} 
      className={className}
      loading="lazy"
    />
  )
}
```

### **4.2 Usar en componentes**

Reemplazar `<img>` por `<QuoteImage>` en todos los componentes que muestran imágenes.

---

## 🔧 Paso 5: Migración de datos existentes

### **5.1 Script de migración**

Crear `scripts/migrate-images-to-storage.ts`:

```typescript
import { supabase } from "../lib/supabase"
import { uploadImage, isBase64 } from "../lib/storage-helpers"

async function migrateQuoteImages() {
  console.log("🚀 Iniciando migración de imágenes...")
  
  // 1. Obtener todas las cotizaciones
  const { data: quotes, error } = await supabase
    .from("quotes")
    .select("*")
    .limit(1000)
  
  if (error) {
    console.error("Error al obtener cotizaciones:", error)
    return
  }
  
  console.log(`📊 Total de cotizaciones: ${quotes.length}`)
  
  let migrated = 0
  let skipped = 0
  let errors = 0
  
  // 2. Migrar cada cotización
  for (const quote of quotes) {
    try {
      let needsUpdate = false
      const updates: any = {}
      
      // Migrar imágenes de vuelos
      if (quote.flights_data?.length > 0) {
        const migratedFlights = await Promise.all(
          quote.flights_data.map(async (flight: any) => {
            if (flight.imagenes?.length > 0) {
              const migratedImages = await Promise.all(
                flight.imagenes.map(async (img: string) => {
                  if (isBase64(img)) {
                    const url = await uploadImage(img, quote.user_id, quote.id)
                    return url
                  }
                  return img // Ya es URL
                })
              )
              return { ...flight, imagenes: migratedImages }
            }
            return flight
          })
        )
        updates.flights_data = migratedFlights
        needsUpdate = true
      }
      
      // Repetir para accommodations_data, transfers_data, etc.
      // ... (similar al código de flights)
      
      // 3. Actualizar cotización si hay cambios
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from("quotes")
          .update(updates)
          .eq("id", quote.id)
        
        if (updateError) {
          console.error(`❌ Error al actualizar ${quote.id}:`, updateError)
          errors++
        } else {
          console.log(`✅ Migrada: ${quote.title}`)
          migrated++
        }
      } else {
        console.log(`⏭️ Sin cambios: ${quote.title}`)
        skipped++
      }
      
    } catch (error) {
      console.error(`❌ Error en ${quote.id}:`, error)
      errors++
    }
  }
  
  console.log("\n📊 Resumen de migración:")
  console.log(`✅ Migradas: ${migrated}`)
  console.log(`⏭️ Sin cambios: ${skipped}`)
  console.log(`❌ Errores: ${errors}`)
}

// Ejecutar migración
migrateQuoteImages()
```

### **5.2 Ejecutar migración**

```bash
# Hacer backup primero
# Luego ejecutar:
npx ts-node scripts/migrate-images-to-storage.ts
```

---

## ✅ Checklist de implementación

### **Paso 1: Storage**
- [ ] Crear bucket `quote-images`
- [ ] Configurar políticas
- [ ] Probar subida manual

### **Paso 2: Helpers**
- [ ] Crear `lib/storage-helpers.ts`
- [ ] Probar `uploadImage()`
- [ ] Probar `deleteImage()`

### **Paso 3: Componentes de carga**
- [ ] Modificar FlightsSection
- [ ] Modificar AccommodationsSection
- [ ] Modificar TransfersSection
- [ ] Modificar ServicesSection
- [ ] Modificar CruiseSection
- [ ] Probar crear cotización nueva

### **Paso 4: Visualización**
- [ ] Crear QuoteImage component
- [ ] Reemplazar `<img>` en componentes
- [ ] Probar visualización

### **Paso 5: Migración**
- [ ] Hacer backup de DB
- [ ] Crear script de migración
- [ ] Ejecutar migración
- [ ] Validar resultados

### **Paso 6: Limpieza**
- [ ] Eliminar código legacy
- [ ] Testing completo
- [ ] Monitorear métricas

---

## 🎯 Próximos pasos

¿Por dónde quieres empezar?

1. **Configurar Storage en Supabase** (5 min)
2. **Crear helpers** (15 min)
3. **Modificar componentes** (30 min)
4. **Migrar datos** (variable)

Dime y te guío paso por paso. 🚀
