# Plan de Mejoras - Solicitudes de This Way
## Sistema de Cotizaciones Iterio

**Fecha:** Octubre 2024  
**Versión:** 1.0  
**Stack Tecnológico:** Next.js 14 + TypeScript + Supabase + Puppeteer (PDF)

---

## 📋 Índice
1. [Análisis General](#análisis-general)
2. [Requerimientos del Cliente](#requerimientos-del-cliente)
3. [Análisis de Viabilidad](#análisis-de-viabilidad)
4. [Plan de Implementación](#plan-de-implementación)
5. [Estimación de Esfuerzo](#estimación-de-esfuerzo)

---

## 📊 Análisis General

### Estructura Actual del Proyecto

**Componentes Principales:**
- `flights-section.tsx` - Gestión de vuelos y tarifas
- `accommodation-section.tsx` - Gestión de hoteles y habitaciones  
- `cruise-section.tsx` - Gestión de cruceros
- `summary-section.tsx` - Resumen y totales
- `destination-section.tsx` - Destino y requisitos
- `template-customizer.tsx` - Personalización de templates
- `multi-image-upload.tsx` - Carga de imágenes (límite actual: 4-5 por módulo)

**Generación de PDF:**
- Ruta API: `/app/api/generate-pdf/route.ts`
- Tecnología: Puppeteer (HTML → PDF)
- Sistema de templates con colores y logos personalizables

**Tipos de Cotización:**
- `flight` - Solo vuelos
- `flight_hotel` - Vuelos + Hotel
- `full` - Itinerario completo
- `cruise` - Cruceros

---

## 🎯 Requerimientos del Cliente

### 1. HOTELES - Tarifas Individuales de Habitaciones

**Solicitud:**
> "Poder hacer que se vean las tarifas individuales de las habitaciones de los hoteles sin mostrar el precio final del conjunto de habitaciones. Además, si saco el tilde de 'mostrar en PDF' no aparecen las tarifas individuales de las habitaciones"

**Análisis:**
- **Problema Actual:** El sistema muestra solo el precio total del hotel (suma de todas las habitaciones)
- **Necesidad:** Mostrar precio individual de cada habitación + opción de mostrar/ocultar precio total
- **Comportamiento deseado:** Que el checkbox "mostrar en PDF" afecte solo al total, no a las tarifas individuales

**Archivos afectados:**
- `accommodation-section.tsx` - Agregar checkboxes por habitación
- `summary-section.tsx` - Modificar visualización del resumen
- `generate-pdf/route.ts` - Actualizar lógica de renderizado PDF
- `lib/types.ts` - Agregar campos al tipo `RoomOption`

**Complejidad:** MEDIA (4-6 horas)

---

### 2. HOTELES - Control de Visibilidad de Tarifas

**Solicitud:**
> "Agregar la opción de mostrar o no las tarifas individuales de las habitaciones también. Como siempre pedimos que TODAS las tarifas tengan ese tilde."

**Análisis:**
- **Necesidad:** Checkbox individual para cada habitación (similar al de vuelos)
- **Estado inicial:** Todos los checkboxes activados por defecto
- **Ubicación:** Dentro de cada tarjeta de habitación en `accommodation-section.tsx`

**Archivos afectados:**
- `accommodation-section.tsx` - Agregar `mostrarPrecio` a cada habitación
- `lib/types.ts` - Actualizar interfaz `RoomOption`
- `generate-pdf/route.ts` - Respetar configuración en PDF

**Complejidad:** BAJA (2-3 horas)

---

### 3. HOTELES - Texto Aclaratorio por Grupo Familiar

**Solicitud:**
> "En la hotelería agregar un cartel como en los vuelos que especifique que la tarifa presentada es por grupo familiar por la cantidad de noches indicada"

**Análisis:**
- **Ubicación:** Debajo del precio en cada hotel en el PDF
- **Texto sugerido:** *"Tarifa por grupo familiar de [X] habitaciones por [Y] noches"*
- **Referencia:** Similar al texto que ya existe en vuelos

**Archivos afectados:**
- `generate-pdf/route.ts` - Agregar texto aclaratorio en sección de hoteles

**Complejidad:** BAJA (1-2 horas)

---

### 4. RESUMEN - Precio Total Editable

**Solicitud:**
> "Que en Resúmenes y Totales se puede modificar el Precio Total"

**Análisis:**
- **Problema Actual:** El total se calcula automáticamente (suma de servicios)
- **Necesidad:** Permitir override manual del total
- **Consideraciones:** 
  - Mostrar indicador visual cuando el total es manual vs automático
  - Botón para restablecer al cálculo automático
  - El total manual solo aplica al PDF, los subtotales se mantienen

**Archivos afectados:**
- `summary-section.tsx` - Agregar input editable + lógica de override
- `lib/types.ts` - Agregar campo `totalManual?: number` en `SummaryData`
- `generate-pdf/route.ts` - Usar total manual si existe

**Complejidad:** MEDIA (3-4 horas)

---

### 5. VUELOS - Nueva Opción de Equipaje

**Solicitud:**
> "Agregar la opción 'mochila + equipaje en bodega'"

**Análisis:**
- **Ubicación:** Nueva columna entre "Mochila + Carry On" y "Mochila + Carry On + Valija"
- **Opciones actuales:**
  1. Solo mochila
  2. Mochila + Carry On
  3. Mochila + Carry On + Valija 23kg
- **Nueva estructura:**
  1. Solo mochila
  2. Mochila + Carry On
  3. **Mochila + Equipaje en Bodega** ← NUEVO
  4. Mochila + Carry On + Equipaje en Bodega

**Archivos afectados:**
- `flights-section.tsx` - Agregar nuevos campos de precio y checkbox
- `summary-section.tsx` - Agregar columna en tabla de vuelos
- `lib/types.ts` - Actualizar interfaz `Flight`
- `generate-pdf/route.ts` - Renderizar nueva opción en PDF

**Complejidad:** MEDIA-ALTA (5-7 horas)

---

### 6. VUELOS - Cambio de Terminología

**Solicitud:**
> "Cambiar 'valija 23 kg' por 'equipaje en bodega'. Algunas aerolíneas tiene equipaje de 20 kg, otras de 32kg, por lo que sería mejor generalizarlo"

**Análisis:**
- **Cambio simple:** Reemplazar texto en toda la aplicación
- **Ubicaciones:**
  - Labels en formularios
  - Headers de tablas
  - Textos en PDF
- **Búsqueda:** "valija", "23kg", "23 kg"

**Archivos afectados:**
- `flights-section.tsx` - Labels de inputs
- `summary-section.tsx` - Headers de tabla
- `generate-pdf/route.ts` - Textos en PDF

**Complejidad:** MUY BAJA (30 min - 1 hora)

---

### 7. VUELOS - Aclaración de Tarifa por Pasajero

**Solicitud:**
> "En Vuelos en el PDF, poner la aclaración de que las tarifas son por pasajero al lado de la tarifa"

**Análisis:**
- **Ubicación:** Al lado de cada precio en la tabla de vuelos del PDF
- **Formato sugerido:** "USD 500.00 *por pasajero*" o pequeño asterisco con nota al pie
- **Alternativa:** Nota general arriba de la tabla: *"Todas las tarifas son por pasajero"*

**Archivos afectados:**
- `generate-pdf/route.ts` - Agregar texto aclaratorio en sección de vuelos

**Complejidad:** BAJA (1-2 horas)

---

### 8. PDF - Límite de Imágenes General

**Solicitud:**
> "Al parecer el PDF general tiene una capacidad máxima de imágenes, se puede aumentar ese límite? Si tiene varias imágenes no carga la pre-visualización de la cotización"

**Análisis:**
- **Problema Actual:** Puppeteer tiene timeouts y límites de memoria con muchas imágenes
- **Causas posibles:**
  - Timeout de generación (tiempo límite)
  - Tamaño de imágenes sin optimizar
  - Límite de memoria del proceso
- **Soluciones:**
  1. Optimización agresiva de imágenes (reducir calidad/tamaño)
  2. Lazy loading de imágenes en HTML antes de PDF
  3. Aumentar timeout de Puppeteer
  4. Implementar compresión WebP
  5. Paginación del PDF (dividir en múltiples páginas si es muy largo)

**Archivos afectados:**
- `image-optimizer.ts` - Mejorar compresión (ya existe, revisar configuración)
- `generate-pdf/route.ts` - Aumentar timeouts de Puppeteer
- Configuración de Vercel/servidor (límites de memoria)

**Complejidad:** MEDIA-ALTA (4-6 horas de testing y ajustes)

---

### 9. MÓDULOS - Límite de Imágenes por Sección

**Solicitud:**
> "Subir el límite de imágenes por módulo, ej: 6 imágenes"

**Análisis:**
- **Límite Actual:** 4 imágenes en vuelos, hoteles, traslados, servicios
- **Nuevo Límite Propuesto:** 6 imágenes
- **Consideración:** Esto incrementará el problema del punto #8, por lo que ambos deben implementarse juntos

**Archivos afectados:**
- `flights-section.tsx` - `maxImages={4}` → `maxImages={6}`
- `accommodation-section.tsx` - `maxImages={4}` → `maxImages={6}`
- `cruise-section.tsx` - `maxImages={4}` → `maxImages={6}`
- `transfers-section.tsx` - `maxImages={4}` → `maxImages={6}`
- `services-section.tsx` - `maxImages={4}` → `maxImages={6}`

**Complejidad:** MUY BAJA (15-30 min)  
**Nota:** Debe ir después de optimizar el punto #8

---

### 10. VUELOS - Múltiples Tarifas por Opción

**Solicitud:**
> "Poder agregar más de una tarifa en la misma opción de vuelo (por ejemplo, Economy y Premium Economy). Hay veces que los pasajeros quieren comparar distintas tarifas."

**Análisis:**
- **Cambio Estructural IMPORTANTE:** Actualmente 1 vuelo = 1 tarifa
- **Nueva Estructura:** 1 vuelo = múltiples tarifas (array de tarifas)
- **Implicaciones:**
  - Refactorización completa del modelo de datos de vuelos
  - Interfaz más compleja en formulario
  - Tabla de resumen con múltiples filas por vuelo
  - PDF con acordeón o secciones expandibles

**Propuesta de UI:**
```
Vuelo 1: Buenos Aires → Madrid
  ├─ Tarifa Economy
  │   ├─ Solo mochila: $500
  │   ├─ Mochila + Carry On: $600
  │   └─ ...
  └─ Tarifa Premium Economy
      ├─ Solo mochila: $800
      ├─ Mochila + Carry On: $900
      └─ ...
```

**Archivos afectados:**
- `lib/types.ts` - Reestructurar modelo de Flight (crear interfaz `FlightFare`)
- `flights-section.tsx` - UI para agregar múltiples tarifas por vuelo
- `summary-section.tsx` - Expandir tabla para mostrar todas las tarifas
- `generate-pdf/route.ts` - Renderizar múltiples tarifas en PDF
- Base de datos Supabase - Migración de esquema (si se guardan cotizaciones)

**Complejidad:** ALTA (12-16 horas)  
**Riesgo:** Breaking change - puede afectar cotizaciones existentes

---

### 11. NUEVO MÓDULO - Alquiler de Autos

**Solicitud:**
> "Agregar módulo para alquiler de autos – modelo de auto, fecha y lugar de retiro, fecha y lugar de devolución, seguro incluído, tanque de nafta, adicionales a pagar en destino, monto de tarjeta en garantía, si es manual o automático, precio y observaciones (seria como un caso particular de servicios adicionales)"

**Análisis:**
- **Nuevo Componente:** `car-rental-section.tsx`
- **Campos requeridos:**
  1. Modelo de auto (texto)
  2. Fecha de retiro (date)
  3. Lugar de retiro (texto)
  4. Fecha de devolución (date)
  5. Lugar de devolución (texto)
  6. Seguro incluído (checkbox o select)
  7. Tanque de nafta (select: Lleno/Vacío/Medio)
  8. Adicionales a pagar en destino (textarea)
  9. Monto garantía tarjeta (number)
  10. Transmisión (select: Manual/Automático)
  11. Precio (number)
  12. Observaciones (textarea)
  13. Imágenes (multi-upload)

**Archivos a crear:**
- `components/car-rental-section.tsx` - Nuevo componente

**Archivos a modificar:**
- `lib/types.ts` - Agregar interfaz `CarRental` y campo en `FormDataForSidebar`
- `app/page.tsx` o archivo principal - Agregar sección al formulario
- `summary-section.tsx` - Agregar sección de resumen
- `generate-pdf/route.ts` - Renderizar en PDF
- Componentes de validación y help panel

**Complejidad:** ALTA (10-14 horas)

---

### 12. TEMPLATES - Requisitos Pre-seleccionados

**Solicitud:**
> "Agregar requisitos a template – que todos los modelos de template (solo color, logo o advertencia en rojo) sean iguales – que cada template pueda tener requisitos pre-seleccionados"

**Análisis:**
- **Concepto:** Los templates deben incluir requisitos migratorios predefinidos
- **Ejemplo:** Template "Europa" → automáticamente incluye "Pasaporte 6 meses vigencia", "Visa Schengen", etc.
- **Ubicación:** Dentro de `template-customizer.tsx`

**Nueva funcionalidad en templates:**
```typescript
interface TemplateData {
  // ... campos existentes ...
  preselectedRequirements: string[] // Nuevo campo
}
```

**Archivos afectados:**
- `lib/types.ts` - Actualizar interfaz `Template`
- `template-customizer.tsx` - Agregar sección de requisitos
- `flights-section.tsx` - Auto-seleccionar requisitos del template activo
- Base de datos - Migración para agregar campo

**Complejidad:** MEDIA (5-7 horas)

---

### 13. CRUCEROS - Cuadro de Observaciones

**Solicitud:**
> "Agregar cuadro de observaciones en el módulo de crucero"

**Análisis:**
- **Campo faltante:** Textarea para observaciones/comentarios
- **Ubicación:** Al final del formulario de crucero, antes de las imágenes

**Archivos afectados:**
- `cruise-section.tsx` - Agregar campo `observaciones` (textarea)
- `lib/types.ts` - Agregar campo `observaciones?: string` en interfaz `Cruise`
- `generate-pdf/route.ts` - Renderizar observaciones en PDF

**Complejidad:** MUY BAJA (1 hora)

---

### 14. HOTELES - Cambio de Terminología

**Solicitud:**
> "En el apartado de hotel, quitar: 'sin desayuno' y reemplazarlo por 'solo habitación' – es más claro para el pasajero"

**Análisis:**
- **Cambio en el enum de regimen:**
  - Antes: `"sin_desayuno"`
  - Después: `"solo_habitacion"`
- **Retrocompatibilidad:** Considerar cotizaciones existentes con valor antiguo

**Archivos afectados:**
- `accommodation-section.tsx` - Cambiar label del select
- `generate-pdf/route.ts` - Actualizar texto en PDF
- `lib/types.ts` - Actualizar tipo (opcional, si está tipado como literal)

**Complejidad:** MUY BAJA (30 min)

---

### 15. DESTINO - Requisitos por Tipo de Viaje

**Solicitud:**
> "Dividir destino entre: INTERNACIONAL – donde aparezca que se debe tener el pasaporte con 6 meses de vigencia exceptuando países del Mercosur, en caso de viajar con un menor de edad se requiere autorización. Y NACIONAL – donde aparezca que el DNI debe estar vigente."

**Análisis:**
- **Nuevo campo:** Tipo de destino (Nacional/Internacional)
- **Requisitos automáticos según tipo:**
  
**INTERNACIONAL:**
- "Pasaporte con 6 meses de vigencia (excepto Mercosur)"
- "Autorización para menores de edad"

**NACIONAL:**
- "DNI vigente"

**Archivos afectados:**
- `destination-section.tsx` - Agregar radio button o select para tipo
- `lib/types.ts` - Agregar campo `tipoDestino: 'nacional' | 'internacional'`
- `generate-pdf/route.ts` - Mostrar requisitos al inicio del PDF (no en vuelos)

**Complejidad:** MEDIA (3-5 horas)

---

### 16. REQUISITOS - Reubicación en PDF

**Solicitud:**
> "Quitar los requisitos migratorios de la parte de vuelos y agregarlos al inicio de la cotización (Destino y Año)"

**Análisis:**
- **Cambio en estructura del PDF:**
  - Antes: Requisitos dentro de cada sección de vuelo
  - Después: Requisitos consolidados al inicio, debajo de "Destino y Año"
- **Deduplicación:** Si hay múltiples vuelos con requisitos repetidos, mostrar solo una vez
- **Combinación con punto #15:** Los requisitos serán la suma de:
  - Requisitos automáticos por tipo de destino (Nacional/Internacional)
  - Requisitos específicos agregados manualmente en vuelos

**Archivos afectados:**
- `generate-pdf/route.ts` - Mover sección de requisitos al inicio
- Lógica de consolidación de requisitos únicos

**Complejidad:** MEDIA (3-4 horas)

---

## ✅ Análisis de Viabilidad

### Resumen de Complejidad

| ID | Funcionalidad | Complejidad | Horas Est. | Prioridad |
|----|---------------|-------------|-----------|-----------|
| 6 | Cambio "valija" → "equipaje en bodega" | MUY BAJA | 0.5-1 | 🔴 ALTA |
| 9 | Límite imágenes 4→6 | MUY BAJA | 0.5 | 🟡 MEDIA |
| 13 | Observaciones en cruceros | MUY BAJA | 1 | 🟡 MEDIA |
| 14 | "Sin desayuno" → "Solo habitación" | MUY BAJA | 0.5 | 🔴 ALTA |
| 2 | Control visibilidad tarifas habitaciones | BAJA | 2-3 | 🔴 ALTA |
| 3 | Texto aclaratorio hoteles | BAJA | 1-2 | 🟡 MEDIA |
| 7 | Aclaración tarifa por pasajero | BAJA | 1-2 | 🟡 MEDIA |
| 1 | Tarifas individuales habitaciones | MEDIA | 4-6 | 🔴 ALTA |
| 4 | Precio total editable | MEDIA | 3-4 | 🟢 BAJA |
| 8 | Límite imágenes PDF | MEDIA-ALTA | 4-6 | 🔴 ALTA |
| 12 | Requisitos pre-seleccionados | MEDIA | 5-7 | 🟢 BAJA |
| 15 | Destino Nacional/Internacional | MEDIA | 3-5 | 🟡 MEDIA |
| 16 | Reubicación requisitos | MEDIA | 3-4 | 🟡 MEDIA |
| 5 | Nueva opción equipaje | MEDIA-ALTA | 5-7 | 🟡 MEDIA |
| 10 | Múltiples tarifas por vuelo | ALTA | 12-16 | 🟢 BAJA |
| 11 | Módulo alquiler autos | ALTA | 10-14 | 🟢 BAJA |

**TOTAL ESTIMADO:** 56-81 horas de desarrollo

---

## 🚀 Plan de Implementación

### FASE 1: Quick Wins (5-8 horas)
**Objetivo:** Cambios rápidos con alto impacto

1. ✅ Cambio terminología "valija" → "equipaje bodega" (0.5-1h)
2. ✅ Cambio "sin desayuno" → "solo habitación" (0.5h)
3. ✅ Observaciones en cruceros (1h)
4. ✅ Control visibilidad tarifas habitaciones (2-3h)
5. ✅ Texto aclaratorio hoteles (1-2h)
6. ✅ Aclaración tarifa por pasajero vuelos (1-2h)

**Entregable:** Primera versión con mejoras cosméticas y UX

---

### FASE 2: Hoteles y Tarifas (8-12 horas)
**Objetivo:** Mejorar gestión de hoteles

1. ✅ Tarifas individuales de habitaciones (4-6h)
2. ✅ Precio total editable en resumen (3-4h)
3. ✅ Límite de imágenes 4→6 por módulo (0.5h)

**Entregable:** Sistema de hoteles completo y flexible

---

### FASE 3: Optimización de PDF (4-6 horas)
**Objetivo:** Resolver problemas de rendimiento

1. ✅ Optimización de imágenes (2-3h)
2. ✅ Aumento de timeouts Puppeteer (1h)
3. ✅ Testing con múltiples imágenes (1-2h)

**Entregable:** PDF estable con múltiples imágenes

---

### FASE 4: Vuelos y Equipaje (8-12 horas)
**Objetivo:** Ampliar opciones de equipaje

1. ✅ Nueva opción "mochila + equipaje bodega" (5-7h)
2. ✅ Destino Nacional/Internacional (3-5h)

**Entregable:** Sistema de vuelos más completo

---

### FASE 5: Requisitos Migratorios (8-11 horas)
**Objetivo:** Mejorar gestión de requisitos

1. ✅ Reubicación de requisitos al inicio (3-4h)
2. ✅ Requisitos pre-seleccionados en templates (5-7h)

**Entregable:** Sistema de requisitos centralizado

---

### FASE 6: Módulos Nuevos (22-30 horas)
**Objetivo:** Expandir funcionalidades

1. ✅ Módulo alquiler de autos (10-14h)
2. ✅ Múltiples tarifas por vuelo (12-16h) ← **BREAKING CHANGE**

**Entregable:** Sistema completo con nuevos módulos

---

## 📅 Cronograma Sugerido

**Sprint 1 (Semana 1):** Fases 1 + 2 = 13-20 horas  
**Sprint 2 (Semana 2):** Fase 3 + 4 = 12-18 horas  
**Sprint 3 (Semana 3):** Fase 5 = 8-11 horas  
**Sprint 4 (Semana 4-5):** Fase 6 = 22-30 horas  

**Total:** 4-5 semanas de desarrollo

---

## ⚠️ Riesgos y Consideraciones

### Riesgos Técnicos

1. **Breaking Changes:**
   - La funcionalidad #10 (múltiples tarifas) requiere migración de base de datos
   - Puede afectar cotizaciones existentes guardadas

2. **Rendimiento PDF:**
   - Aumentar imágenes puede causar timeouts en producción
   - Requiere testing exhaustivo con diferentes cantidades de imágenes

3. **Retrocompatibilidad:**
   - Cambios en enums (`sin_desayuno` → `solo_habitacion`) pueden afectar datos existentes
   - Necesita migración o mapeo de datos antiguos

### Recomendaciones

1. **Testing:**
   - Crear suite de tests para cada módulo
   - Test de regresión para cotizaciones existentes
   - Test de rendimiento con PDFs grandes

2. **Migración de Datos:**
   - Plan de migración para cambios en base de datos
   - Script de respaldo antes de cambios críticos

3. **Documentación:**
   - Actualizar documentación de usuario
   - Crear changelog detallado
   - Videos tutoriales para nuevas funcionalidades

4. **Implementación Gradual:**
   - Feature flags para funcionalidades en beta
   - Rollout progresivo (comenzar con usuarios seleccionados)

---

## 📝 Notas Adicionales

### Preguntas para el Cliente

1. **Priorización:** ¿Cuáles son las 5 funcionalidades más urgentes?
2. **Breaking Changes:** ¿Hay cotizaciones activas que puedan verse afectadas?
3. **Presupuesto:** ¿Existe un límite de horas/presupuesto para las mejoras?
4. **Timeline:** ¿Cuál es la fecha límite esperada?

### Próximos Pasos

1. Validar prioridades con el cliente
2. Definir alcance del MVP (¿implementar todo o por fases?)
3. Preparar ambiente de staging para testing
4. Crear tickets detallados en sistema de gestión de proyectos
5. Asignar recursos y comenzar Sprint 1

---

## 🏁 Conclusión

El proyecto es **100% viable** técnicamente. Todas las solicitudes pueden implementarse sin cambios arquitectónicos mayores, excepto la funcionalidad #10 (múltiples tarifas por vuelo) que requiere refactorización significativa.

**Recomendación:** Implementar en fases según el cronograma propuesto, priorizando Fases 1-3 para obtener mejoras rápidas y visible valor agregado, dejando las funcionalidades más complejas para el final.

**Esfuerzo Total:** 56-81 horas (7-10 días de trabajo efectivo)  
**Plazo Recomendado:** 4-5 semanas con testing incluido  
**Nivel de Riesgo:** BAJO-MEDIO

---

*Documento generado el 29 de Octubre de 2024*  
*Versión: 1.0*  
*Próxima revisión: Post-validación con cliente*
