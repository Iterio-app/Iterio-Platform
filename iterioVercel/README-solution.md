# Solución: Mostrar/Ocultar Cantidad de Pasajeros en Sidebar

## Problema Original
El checkbox para mostrar/ocultar la cantidad de pasajeros en el PDF no actualizaba el sidebar en tiempo real. El sidebar no recibía el valor actualizado de `mostrarCantidadPasajeros`.

## Problemas Adicionales Identificados
Durante la implementación se identificaron y corrigieron varios problemas adicionales:

1. **Precios de infantes no se mostraban** en el sidebar de vuelos
2. **Fechas incorrectas** (1 día antes) en todas las secciones del sidebar
3. **Check "Mostrar precio en PDF" de alojamientos** no funcionaba en el sidebar
4. **Faltaban checks "Mostrar precio en PDF"** para traslados y servicios adicionales
5. **Estética inconsistente** entre los diferentes checks
6. **Faltaba funcionalidad** para mostrar cantidad de noches en alojamientos

## Solución Implementada

### 1. Tipos TypeScript Centralizados (`lib/types.ts`)
Se creó un archivo de tipos compartidos para evitar duplicación y mejorar la mantenibilidad:

```typescript
export interface FormDataForSidebar {
  // Datos básicos de la cotización
  quoteTitle: string;
  clientName: string;
  
  // Datos del formulario
  destinationData: { /* ... */ };
  clientData: { /* ... */ };
  
  // Servicios
  flights: any[];
  accommodations: any[];
  transfers: any[];
  services: any[];
  
  // Configuración
  selectedCurrency: string;
  formMode: 'flight' | 'flight_hotel' | 'full';
  
  // Datos del resumen (incluye mostrarCantidadPasajeros)
  summaryData: {
    // ... otros campos
    mostrarCantidadPasajeros?: boolean;
    currency?: string;
  };
  
  // Flags de configuración (para acceso directo)
  mostrarCantidadPasajeros: boolean;
}

export interface FormDataProps {
  formData: Partial<FormDataForSidebar>;
}
```

### 2. Paso Completo de Datos al Sidebar (`app/page.tsx`)
Se modificó el objeto `formData` que se pasa al `UnifiedSidebar` para incluir todos los datos necesarios:

```typescript
<UnifiedSidebar
  visible={true}
  onToggle={() => setShowUnifiedSidebar(false)}
  formData={{
    quoteTitle,
    clientName,
    destinationData,
    clientData,
    flights,
    accommodations,
    transfers,
    services,
    selectedCurrency,
    formMode,
    summaryData: {
      ...summaryData,
      mostrarCantidadPasajeros,
      currency: selectedCurrency,
    },
    mostrarCantidadPasajeros, // Acceso directo
  }}
  helpErrors={calculateHelpErrors()}
  summaryItems={calculateSummaryItems()}
/>
```

### 3. Lógica Robusta en SummaryContent (`components/summary-content.tsx`)
Se implementó una función helper que maneja múltiples fuentes del valor `mostrarCantidadPasajeros`:

```typescript
const getMostrarCantidadPasajeros = (): boolean => {
  // Prioridad 1: valor directo en formData
  if (formData.mostrarCantidadPasajeros !== undefined) {
    return formData.mostrarCantidadPasajeros;
  }
  
  // Prioridad 2: valor en summaryData
  if (formData.summaryData?.mostrarCantidadPasajeros !== undefined) {
    return formData.summaryData.mostrarCantidadPasajeros;
  }
  
  // Valor por defecto: true (mostrar)
  return true;
};
```

### 4. Correcciones de Problemas Identificados

#### 4.1 Precios de Infantes (`components/summary-content.tsx`)
**Problema**: Se buscaban campos inexistentes (`mostrarPrecioInfanteMochila`, etc.)
**Solución**: Corregido para usar los campos correctos:

```typescript
{/* Precios Infantes */}
{vuelo.mostrarPrecioInfante && vuelo.precioInfante && (
  <div className="space-y-1">
    <div className="text-sm text-gray-700 font-medium">Precios Infantes:</div>
    <div className="ml-4 space-y-1">
      <div className="text-xs text-gray-600">
        <span className="font-medium">• Tarifa única:</span> {getCurrencySymbol(vuelo.useCustomCurrency ? vuelo.currency : formData.selectedCurrency)} {vuelo.precioInfante}
      </div>
    </div>
  </div>
)}
```

#### 4.2 Fechas Incorrectas (`components/summary-content.tsx`)
**Problema**: `toLocaleDateString("es-ES")` causaba problemas de zona horaria
**Solución**: Implementado parsing manual de fechas:

```typescript
function formatDate(dateStr: string) {
  if (!dateStr) return "";
  try {
    // Crear la fecha y ajustar para evitar problemas de zona horaria
    const [year, month, day] = dateStr.split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
    // Fallback al método anterior si el formato no es YYYY-MM-DD
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES");
  } catch {
    return dateStr;
  }
}
```

#### 4.3 Check "Mostrar precio en PDF" para Alojamientos (`components/summary-content.tsx`)
**Problema**: No se respetaba el campo `mostrarPrecio` en el sidebar
**Solución**: Agregada condición para respetar el check:

```typescript
{aloj.mostrarPrecio && hab.precio && (
  <div className="text-xs text-gray-500">
    <span className="font-medium">• Precio:</span> {getCurrencySymbol(aloj.useCustomCurrency ? aloj.currency : formData.selectedCurrency)} {hab.precio}
  </div>
)}
```

#### 4.4 Checks "Mostrar precio en PDF" para Traslados y Servicios
**Problema**: Faltaban los checks en los formularios
**Solución**: Agregados en ambos componentes:

**Traslados** (`components/transfers-section.tsx`):
```typescript
<div className="flex items-center gap-2 mt-2">
  <input
    id={`mostrarPrecio-${transfer.id}`}
    type="checkbox"
    checked={transfer.mostrarPrecio}
    onChange={e => updateTransfer(transfer.id, "mostrarPrecio", e.target.checked)}
    className="accent-blue-600 h-4 w-4"
  />
  <Label htmlFor={`mostrarPrecio-${transfer.id}`} className="text-sm">
    Mostrar precio en el PDF
  </Label>
</div>
```

**Servicios** (`components/services-section.tsx`):
```typescript
<div className="flex items-center gap-2 mt-2">
  <input
    id={`mostrarPrecio-${service.id}`}
    type="checkbox"
    checked={service.mostrarPrecio}
    onChange={e => updateService(service.id, "mostrarPrecio", e.target.checked)}
    className="accent-blue-600 h-4 w-4"
  />
  <Label htmlFor={`mostrarPrecio-${service.id}`} className="text-sm">
    Mostrar precio en el PDF
  </Label>
</div>
```

#### 4.5 Estética Consistente de Checks
**Problema**: Los checks tenían estéticas diferentes
**Solución**: Unificada la estética usando `input` HTML nativo con `className="accent-blue-600 h-4 w-4"`:

```typescript
// Estética unificada para todos los checks
<input
  id={`mostrarPrecio-${id}`}
  type="checkbox"
  checked={mostrarPrecio}
  onChange={e => updateField(id, "mostrarPrecio", e.target.checked)}
  className="accent-blue-600 h-4 w-4"
/>
```

#### 4.6 Cantidad de Noches en Alojamientos
**Problema**: Faltaba funcionalidad para mostrar cantidad de noches
**Solución**: Implementada funcionalidad completa:

**Cálculo automático** (`components/accommodation-section.tsx`):
```typescript
// Calcular noches automáticamente cuando cambian las fechas
if (field === "checkin" || field === "checkout") {
  const checkin = field === "checkin" ? value as string : accommodation.checkin;
  const checkout = field === "checkout" ? value as string : accommodation.checkout;
  
  if (checkin && checkout) {
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    
    // Solo calcular si las fechas son válidas (checkin < checkout)
    if (checkinDate < checkoutDate) {
      const diffTime = checkoutDate.getTime() - checkinDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      updated.cantidadNoches = diffDays > 0 ? diffDays : 1;
    } else {
      // Si las fechas son inválidas, mantener el valor anterior o 1
      updated.cantidadNoches = accommodation.cantidadNoches || 1;
    }
  }
}
```

**Interfaz de usuario**:
```typescript
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <Label htmlFor={`cantidadNoches-${accommodation.id}`}>Cantidad de noches</Label>
    <div className="flex items-center gap-2">
      <input
        id={`mostrarCantidadNoches-${accommodation.id}`}
        type="checkbox"
        checked={accommodation.mostrarCantidadNoches}
        onChange={e => updateAccommodation(accommodation.id, "mostrarCantidadNoches", e.target.checked)}
        className="accent-blue-600 h-4 w-4"
      />
      <Label htmlFor={`mostrarCantidadNoches-${accommodation.id}`} className="text-sm">
        Mostrar en el PDF
      </Label>
    </div>
  </div>
  <Input
    id={`cantidadNoches-${accommodation.id}`}
    type="number"
    min="1"
    value={accommodation.cantidadNoches}
    onChange={(e) => updateAccommodation(accommodation.id, "cantidadNoches", parseInt(e.target.value) || 1)}
    className="w-32"
  />
  <p className="text-xs text-gray-500">
    Se calcula automáticamente según las fechas. Puedes modificarlo manualmente si es necesario.
  </p>
</div>
```

**Mostrar en sidebar** (`components/summary-content.tsx`):
```typescript
{aloj.mostrarCantidadNoches && aloj.cantidadNoches && (
  <div className="text-sm text-gray-700">
    <span className="font-medium">Cantidad de noches:</span> {aloj.cantidadNoches}
  </div>
)}
```

#### 4.7 Validaciones de Fechas
**Problema**: No había validación para prevenir fechas inválidas
**Solución**: Implementadas validaciones completas en frontend y backend:

**Alojamientos** (`components/accommodation-section.tsx`):
```typescript
// Validación en inputs
<Input
  id={`checkin-${accommodation.id}`}
  type="date"
  value={accommodation.checkin}
  onChange={(e) => updateAccommodation(accommodation.id, "checkin", e.target.value)}
  min={new Date().toISOString().split('T')[0]}
/>

<Input
  id={`checkout-${accommodation.id}`}
  type="date"
  value={accommodation.checkout}
  onChange={(e) => updateAccommodation(accommodation.id, "checkout", e.target.value)}
  min={accommodation.checkin ? new Date(accommodation.checkin).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
/>

// Mensaje de error
{accommodation.checkin && accommodation.checkout && new Date(accommodation.checkin) >= new Date(accommodation.checkout) && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
    <div className="flex items-center gap-2">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <span className="text-sm text-red-700 font-medium">Error en las fechas</span>
    </div>
    <p className="text-xs text-red-600 mt-1">
      La fecha de check-in debe ser anterior a la fecha de check-out.
    </p>
  </div>
)}
```

**Vuelos** (`components/flights-section.tsx`):
```typescript
// Validación en inputs
<Input
  id={`fechaSalida-${flight.id}`}
  type="date"
  value={flight.fechaSalida || ""}
  onChange={(e) => updateFlight(flight.id, "fechaSalida", e.target.value)}
  min={new Date().toISOString().split('T')[0]}
/>

<Input
  id={`fechaRetorno-${flight.id}`}
  type="date"
  value={flight.fechaRetorno || ""}
  onChange={(e) => updateFlight(flight.id, "fechaRetorno", e.target.value)}
  min={flight.fechaSalida ? flight.fechaSalida : new Date().toISOString().split('T')[0]}
/>

// Mensaje de error
{flight.fechaSalida && flight.fechaRetorno && new Date(flight.fechaSalida) > new Date(flight.fechaRetorno) && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
    <div className="flex items-center gap-2">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <span className="text-sm text-red-700 font-medium">Error en las fechas</span>
    </div>
    <p className="text-xs text-red-600 mt-1">
      La fecha de salida no puede ser posterior a la fecha de retorno.
    </p>
  </div>
)}
```

**Validación en Backend** (`app/page.tsx`):
```typescript
// En saveCurrentQuote y prepareQuoteData
const invalidAccommodations = accommodations.filter(acc => {
  if (acc.checkin && acc.checkout) {
    return new Date(acc.checkin) >= new Date(acc.checkout);
  }
  return false;
});

const invalidFlights = flights.filter(flight => {
  if (flight.fechaSalida && flight.fechaRetorno) {
    return new Date(flight.fechaSalida) > new Date(flight.fechaRetorno);
  }
  return false;
});

if (invalidAccommodations.length > 0 || invalidFlights.length > 0) {
  throw new Error("Hay fechas inválidas en alojamientos o vuelos. Por favor, corrige las fechas antes de continuar.");
}
```

### 5. Componentes Actualizados
- **`UnifiedSidebar`**: Ahora extiende `FormDataProps` para consistencia de tipos
- **`SummaryContent`**: Usa `FormDataProps` y maneja valores opcionales de manera segura
- **`app/page.tsx`**: Pasa datos completos incluyendo `summaryData` y `mostrarCantidadPasajeros`
- **`transfers-section.tsx`**: Agregado check "Mostrar precio en PDF" con estética unificada
- **`services-section.tsx`**: Agregado check "Mostrar precio en PDF" con estética unificada
- **`accommodation-section.tsx`**: Agregada funcionalidad de cantidad de noches y estética unificada

## Beneficios de la Solución

### ✅ Escalabilidad
- **Tipos centralizados**: Fácil agregar nuevos campos sin duplicar código
- **Interfaces consistentes**: Todos los componentes usan los mismos tipos
- **Funciones helper**: Lógica reutilizable para manejar datos opcionales

### ✅ Robustez
- **Múltiples fuentes de datos**: El componente puede obtener `mostrarCantidadPasajeros` de diferentes lugares
- **Valores por defecto**: Comportamiento predecible cuando faltan datos
- **Verificaciones de seguridad**: Manejo seguro de valores opcionales
- **Fechas correctas**: Parsing manual evita problemas de zona horaria
- **Cálculo automático**: Cantidad de noches se calcula automáticamente

### ✅ Mantenibilidad
- **Un solo lugar para tipos**: Cambios en `lib/types.ts` se reflejan en toda la app
- **Código limpio**: Eliminación de duplicación de tipos
- **Documentación clara**: Cada tipo tiene comentarios explicativos
- **Estética unificada**: Todos los checks tienen la misma apariencia

### ✅ Funcionalidad Completa
- **Actualización en tiempo real**: El sidebar se actualiza inmediatamente al cambiar el checkbox
- **Compatibilidad hacia atrás**: Funciona con datos existentes que no tengan el campo
- **Flexibilidad**: Permite acceso directo o a través de `summaryData`
- **Precios de infantes**: Ahora se muestran correctamente
- **Fechas correctas**: Se muestran en el formato DD/MM/YYYY sin problemas de zona horaria
- **Checks de precio**: Funcionan para alojamientos, traslados y servicios
- **Estética consistente**: Todos los checks tienen la misma apariencia
- **Cantidad de noches**: Se calcula automáticamente y se puede editar manualmente
- **Posición optimizada**: Checks de precio están debajo del campo precio en traslados y servicios

## Uso

1. **Cambiar el checkbox** en la sección de datos del cliente
2. **El sidebar se actualiza automáticamente** mostrando/ocultando la sección de pasajeros
3. **Los precios de infantes** se muestran correctamente en la sección de vuelos
4. **Las fechas** se muestran en el formato correcto (DD/MM/YYYY)
5. **Los checks "Mostrar precio en PDF"** funcionan para todas las secciones con estética unificada
6. **La cantidad de noches** se calcula automáticamente en alojamientos y se puede editar manualmente
7. **El valor se guarda** en la base de datos junto con la cotización
8. **Se restaura correctamente** al cargar una cotización existente

## Archivos Modificados

- `lib/types.ts` - Tipos compartidos centralizados
- `app/page.tsx` - Paso completo de datos al sidebar
- `components/summary-content.tsx` - Lógica robusta para mostrar/ocultar + correcciones + cantidad de noches
- `components/unified-sidebar.tsx` - Tipos actualizados
- `components/transfers-section.tsx` - Agregado check "Mostrar precio en PDF" con estética unificada
- `components/services-section.tsx` - Agregado check "Mostrar precio en PDF" con estética unificada
- `components/accommodation-section.tsx` - Agregada funcionalidad de cantidad de noches y estética unificada
- `README-solution.md` - Esta documentación

## Próximos Pasos

Para agregar nuevas funcionalidades similares:

1. **Agregar el campo** al tipo `FormDataForSidebar` en `lib/types.ts`
2. **Incluirlo en el objeto** `formData` que se pasa al sidebar
3. **Implementar la lógica** en el componente correspondiente
4. **Usar la función helper** si es necesario manejar múltiples fuentes
5. **Mantener la estética unificada** usando `className="accent-blue-600 h-4 w-4"`

Esta solución proporciona una base sólida y escalable para futuras funcionalidades del sistema de cotizaciones, con correcciones completas para todos los problemas identificados y nuevas funcionalidades de estética consistente y cantidad de noches. 