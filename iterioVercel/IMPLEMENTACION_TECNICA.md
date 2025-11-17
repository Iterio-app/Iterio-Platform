# Guía Técnica de Implementación - Resumen Ejecutivo

## 🔧 Cambios Clave por Archivo

### 1. `lib/types.ts` - Nuevos Tipos

```typescript
// Actualizar RoomOption
interface RoomOption {
  // ... campos existentes
  mostrarPrecio: boolean // NUEVO
  regimen: "solo_habitacion" | ... // Cambio: sin_desayuno → solo_habitacion
}

// Actualizar Accommodation  
interface Accommodation {
  // ... campos existentes
  mostrarPrecioTotal: boolean // NUEVO
  mostrarTarifasIndividuales: boolean // NUEVO
}

// Actualizar Flight - Agregar nueva opción equipaje
interface Flight {
  precioAdultoMochilaBodega: string // NUEVO
  mostrarPrecioAdultoMochilaBodega: boolean // NUEVO
  precioMenorMochilaBodega: string // NUEVO  
  mostrarPrecioMenorMochilaBodega: boolean // NUEVO
  // ... resto de campos
}

// Cruise - Observaciones
interface Cruise {
  observaciones: string // NUEVO
}

// DestinationData - Tipo de viaje
interface DestinationData {
  tipoDestino: 'nacional' | 'internacional' // NUEVO
}

// SummaryData - Total manual
interface SummaryData {
  totalManual?: number // NUEVO
  totalManualActivo: boolean // NUEVO
}

// Template - Requisitos preseleccionados
interface Template {
  template_data: {
    preselectedRequirements: string[] // NUEVO
  }
}

// NUEVO - CarRental
interface CarRental {
  id: string
  modelo: string
  fechaRetiro: string
  lugarRetiro: string
  fechaDevolucion: string
  lugarDevolucion: string
  seguroIncluido: string
  tanqueNafta: "lleno" | "vacio" | "medio"
  adicionalesDestino: string
  montoGarantia: string
  transmision: "manual" | "automatico"
  precio: string
  observaciones: string
  imagenes: string[]
  mostrarPrecio: boolean
  useCustomCurrency?: boolean
  currency?: string
}
```

### 2. Cambios Rápidos (Quick Wins)

**`accommodation-section.tsx`:**
- Cambiar `"sin_desayuno"` → `"solo_habitacion"` (línea ~45)
- Agregar `mostrarPrecio: true` en cada habitación nueva (línea ~62)
- Cambiar `maxImages={4}` → `maxImages={6}` (línea ~260)

**`cruise-section.tsx`:**
- Agregar campo `observaciones` (textarea) después del precio
- Cambiar `maxImages={4}` → `maxImages={6}`

**`flights-section.tsx`:**
- Reemplazar "Valija 23kg" → "Equipaje en Bodega" (líneas ~381, 475)
- Cambiar `maxImages={4}` → `maxImages={6}` (línea ~279)

**`transfers-section.tsx` y `services-section.tsx`:**
- Cambiar `maxImages={4}` → `maxImages={6}`

### 3. Nuevos Archivos a Crear

**`components/car-rental-section.tsx`:**
- Nuevo componente completo (300+ líneas)
- Campos: modelo, fechas, lugares, transmisión, seguro, etc.
- Similar estructura a `cruise-section.tsx`

### 4. Modificaciones en PDF

**`app/api/generate-pdf/route.ts`:**

**A) Mover requisitos al inicio:**
```typescript
// Agregar función para consolidar requisitos
function consolidarRequisitos(data: any): string[] {
  const requisitos = new Set<string>()
  
  // Requisitos por tipo de destino
  if (data.destinationData?.tipoDestino === 'internacional') {
    requisitos.add('Pasaporte con 6 meses de vigencia (excepto Mercosur)')
    requisitos.add('Autorización para menores de edad')
  } else if (data.destinationData?.tipoDestino === 'nacional') {
    requisitos.add('DNI vigente')
  }
  
  // Requisitos de vuelos
  data.flights?.forEach((flight: any) => {
    flight.requisitosMigratorios?.forEach((req: string) => requisitos.add(req))
  })
  
  return Array.from(requisitos)
}

// Renderizar al inicio del HTML, después de destino
const requisitos = consolidarRequisitos(data)
if (requisitos.length > 0) {
  htmlContent += `
    <div class="requisitos-section">
      <h3>Requisitos para el Viaje</h3>
      <ul>
        ${requisitos.map(req => `<li>${req}</li>`).join('')}
      </ul>
    </div>
  `
}
```

**B) Agregar textos aclaratorios:**
```typescript
// En sección de vuelos, agregar nota
htmlContent += `<p class="nota-tarifa">* Las tarifas son por pasajero</p>`

// En sección de hoteles, agregar después del precio
htmlContent += `<p class="nota-hotel">
  Tarifa por grupo familiar de ${acc.cantidadHabitaciones} habitación(es) 
  por ${acc.cantidadNoches} noche(s)
</p>`
```

**C) Respetar visibilidad de tarifas:**
```typescript
// En hoteles, solo mostrar si está activado
if (room.mostrarPrecio) {
  htmlContent += `<div>${room.tipoHabitacion}: ${formatCurrency(room.precio)}</div>`
}

// Precio total solo si está activado
if (acc.mostrarPrecioTotal) {
  htmlContent += `<div>Total: ${formatCurrency(acc.precioTotal)}</div>`
}
```

**D) Agregar sección de alquiler de autos:**
```typescript
if (data.carRentals && data.carRentals.length > 0) {
  htmlContent += `<h2>Alquiler de Autos</h2>`
  data.carRentals.forEach((rental: any) => {
    htmlContent += `
      <div class="car-rental">
        <h3>${rental.modelo}</h3>
        <p>Retiro: ${rental.fechaRetiro} - ${rental.lugarRetiro}</p>
        <p>Devolución: ${rental.fechaDevolucion} - ${rental.lugarDevolucion}</p>
        <p>Transmisión: ${rental.transmision}</p>
        <p>Seguro: ${rental.seguroIncluido}</p>
        ${rental.montoGarantia ? `<p>Garantía: ${formatCurrency(rental.montoGarantia)}</p>` : ''}
        ${rental.adicionalesDestino ? `<p>Adicionales: ${rental.adicionalesDestino}</p>` : ''}
        ${rental.observaciones ? `<p>${rental.observaciones}</p>` : ''}
        ${rental.mostrarPrecio ? `<p class="precio">Precio: ${formatCurrency(rental.precio)}</p>` : ''}
      </div>
    `
  })
}
```

### 5. Optimización de Imágenes

**`lib/image-optimizer.ts`:**
```typescript
// Ajustar configuración para mayor compresión
export async function optimizeImage(
  imageData: string,
  options = {
    maxWidth: 1200,  // Reducir de 1600
    maxHeight: 900,  // Reducir de 1200
    quality: 0.75,   // Reducir de 0.85
  }
) {
  // ... resto del código
}
```

**`app/api/generate-pdf/route.ts`:**
```typescript
// Aumentar timeout de Puppeteer
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  timeout: 60000, // Aumentar de 30000 a 60000
})

// Aumentar timeout de página
await page.goto(url, { 
  waitUntil: 'networkidle2',
  timeout: 60000 
})
```

### 6. Summary Section

**`components/summary-section.tsx`:**

**Agregar total editable:**
```typescript
<div className="mt-4 p-4 border rounded">
  <Label>Precio Total (Editable)</Label>
  <div className="flex items-center gap-2">
    <Input
      type="number"
      step="0.01"
      value={summaryData.totalManualActivo 
        ? (summaryData.totalManual || 0) 
        : allTotalsAmount
      }
      onChange={(e) => {
        const value = parseFloat(e.target.value) || 0
        onSummaryDataChange({
          totalManual: value,
          totalManualActivo: true
        })
      }}
    />
    {summaryData.totalManualActivo && (
      <Button 
        size="sm" 
        variant="outline"
        onClick={() => onSummaryDataChange({ totalManualActivo: false })}
      >
        Restablecer Automático
      </Button>
    )}
  </div>
  {summaryData.totalManualActivo && (
    <p className="text-xs text-orange-600 mt-1">
      ⚠️ Total editado manualmente
    </p>
  )}
</div>
```

---

## 📋 Checklist de Implementación por Fase

### FASE 1: Quick Wins ✅
- [ ] Cambiar "valija" → "equipaje en bodega" en toda la app
- [ ] Cambiar "sin desayuno" → "solo habitación"
- [ ] Agregar `observaciones` en `cruise-section.tsx`
- [ ] Agregar checkboxes de visibilidad por habitación
- [ ] Agregar textos aclaratorios en PDF (hoteles y vuelos)

### FASE 2: Hoteles ✅
- [ ] Implementar control de tarifas individuales
- [ ] Agregar `mostrarPrecioTotal` y `mostrarTarifasIndividuales`
- [ ] Actualizar renderizado en PDF
- [ ] Cambiar `maxImages` a 6 en todos los módulos

### FASE 3: Optimización PDF ✅
- [ ] Ajustar compresión en `image-optimizer.ts`
- [ ] Aumentar timeouts en Puppeteer
- [ ] Testing con múltiples imágenes
- [ ] Implementar lazy loading si es necesario

### FASE 4: Vuelos ✅
- [ ] Agregar opción "Mochila + Equipaje Bodega"
- [ ] Actualizar tipos en `lib/types.ts`
- [ ] Actualizar UI en `flights-section.tsx`
- [ ] Actualizar tabla en `summary-section.tsx`
- [ ] Actualizar renderizado en PDF

### FASE 5: Destinos y Requisitos ✅
- [ ] Agregar `tipoDestino` en `destination-section.tsx`
- [ ] Implementar requisitos automáticos por tipo
- [ ] Consolidar requisitos de todos los vuelos
- [ ] Mover sección de requisitos al inicio del PDF
- [ ] Agregar requisitos preseleccionados en templates

### FASE 6: Nuevos Módulos ✅
- [ ] Crear `car-rental-section.tsx`
- [ ] Agregar tipo `CarRental` en `types.ts`
- [ ] Integrar en formulario principal
- [ ] Agregar en `summary-section.tsx`
- [ ] Renderizar en PDF

---

## 🧪 Testing

### Tests Unitarios
```bash
# Crear tests para cada función nueva
test('consolidarRequisitos debe remover duplicados')
test('formatearTarifaHotel debe mostrar solo habitaciones visibles')
test('calcularTotalManual debe override el total automático')
```

### Tests de Integración
1. Crear cotización con todos los módulos
2. Verificar que PDF se genera con más de 20 imágenes
3. Validar que requisitos no se duplican
4. Verificar retrocompatibilidad con cotizaciones antiguas

### Tests de Performance
- [ ] PDF con 30+ imágenes debe generarse en < 60 segundos
- [ ] Optimización de imágenes no debe degradar calidad visual
- [ ] Formulario debe responder fluidamente con 10+ servicios

---

## 📦 Migración de Datos

### Script SQL para Supabase

```sql
-- Agregar columnas nuevas a tablas existentes
ALTER TABLE templates 
ADD COLUMN preselected_requirements TEXT[] DEFAULT '{}';

-- Migrar valores antiguos de regimen
UPDATE quote_data 
SET accommodations = jsonb_set(
  accommodations,
  '{regimen}',
  '"solo_habitacion"'
)
WHERE accommodations->>'regimen' = 'sin_desayuno';

-- Agregar campos nuevos con valores por defecto
UPDATE quote_data
SET 
  destination_data = jsonb_set(
    destination_data,
    '{tipoDestino}',
    '"internacional"'
  )
WHERE destination_data->>'tipoDestino' IS NULL;
```

---

*Última actualización: 29 de Octubre de 2024*
