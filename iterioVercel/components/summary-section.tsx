  "use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Calculator, FileSpreadsheet } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { Alert } from "@/components/ui/alert"
import { groupAmountsByCurrency } from "@/lib/utils";

interface SummaryData {
  subtotalVuelos: number
  subtotalHoteles: number
  subtotalTraslados: number
  subtotalServicios: number
  subtotalCruceros: number
  subtotal: number
  total: number
  observaciones: string
  mostrarTotal: boolean
  mostrarNotaTarifas: boolean
  mostrarNotaPrecioTotal: boolean
  currency?: string
  totalOverride?: number
}

interface Flight {
  id: string
  nombre: string
  fechaSalida?: string
  fechaRetorno?: string
  tipoTarifa: string
  precioAdultoMochila: string
  precioAdultoMochilaCarryOn: string
  precioAdultoMochilaBodega: string
  precioAdultoMochilaCarryOnBodega: string
  mostrarPrecioAdultoMochila: boolean
  mostrarPrecioAdultoMochilaCarryOn: boolean
  mostrarPrecioAdultoMochilaBodega: boolean
  mostrarPrecioAdultoMochilaCarryOnBodega: boolean
  precioMenorMochila: string
  precioMenorMochilaCarryOn: string
  precioMenorMochilaBodega: string
  precioMenorMochilaCarryOnBodega: string
  mostrarPrecioMenorMochila: boolean
  mostrarPrecioMenorMochilaCarryOn: boolean
  mostrarPrecioMenorMochilaBodega: boolean
  mostrarPrecioMenorMochilaCarryOnBodega: boolean
  precioInfante: string
  mostrarPrecioInfante: boolean
  compania?: string
  aerolinea?: string
  destino?: string
  useCustomCurrency?: boolean;
  currency?: string;
  // Campos legacy para compatibilidad con cotizaciones antiguas
  precioAdultoMochilaCarryOnValija?: string
  precioMenorMochilaCarryOnValija?: string
  mostrarPrecioAdultoMochilaCarryOnValija?: boolean
  mostrarPrecioMenorMochilaCarryOnValija?: boolean
}

interface Accommodation {
  id: string
  nombre: string
  ciudad: string
  checkin: string
  checkout: string
  cantidadHabitaciones: number
  habitaciones: { id: string; tipoHabitacion: string; regimen: string; precio: string }[]
  precioTotal: number
  cantidadNoches?: number
  useCustomCurrency?: boolean;
  currency?: string;
}

interface Transfer {
  id: string
  nombre: string
  origen: string
  destino: string
  tipoTraslado: string
  fecha: string
  hora: string
  precio: string
  useCustomCurrency?: boolean;
  currency?: string;
}

interface Service {
  id: string
  nombre: string
  descripcion: string
  fecha: string
  duracion: string
  precio: string
  useCustomCurrency?: boolean;
  currency?: string;
  textoLibre?: string;
}

interface SummarySectionProps {
  summaryData: SummaryData
  flights: any[]
  accommodations: any[]
  transfers: any[]
  services: any[]
  cruises: any[]
  selectedCurrency: string
  onGeneratePdf: () => void
  isGenerating: boolean
  destinationData?: { ciudad?: string }
  clientData?: { cantidadAdultos: number; cantidadMenores: number; cantidadInfantes: number }
  isSidebarVisible?: boolean
  formMode?: 'flight' | 'flight_hotel' | 'full' | 'cruise'
  onSummaryDataChange?: (data: Partial<SummaryData>) => void
}

export default function SummarySection({
  summaryData,
  flights,
  accommodations,
  transfers,
  services,
  cruises,
  selectedCurrency,
  onGeneratePdf,
  isGenerating,
  destinationData,
  clientData,
  isSidebarVisible = true,
  formMode = 'full',
  onSummaryDataChange,
}: SummarySectionProps) {
  const formatCurrencyBy = (amount: number | string, currency: string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '-';
    return `${currency} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper para obtener valores de campos legacy o nuevos
  const getFlightValue = (flight: Flight, newField: keyof Flight, legacyField?: keyof Flight) => {
    const newValue = flight[newField];
    if (newValue !== undefined && newValue !== '' && newValue !== null) return newValue;
    if (legacyField) {
      const legacyValue = flight[legacyField];
      if (legacyValue !== undefined) return legacyValue;
    }
    return newField.includes('mostrar') ? false : '0';
  };

  // Calcular totales de vuelos por variante
  const flightTotals = {
    soloMochila: 0,
    mochilaCarryOn: 0,
    mochilaBodega: 0,
    mochilaCarryOnBodega: 0,
  };
  flights.forEach(flight => {
    if (flight.mostrarPrecioAdultoMochila) flightTotals.soloMochila += parseFloat(flight.precioAdultoMochila || '0');
    if (flight.mostrarPrecioAdultoMochilaCarryOn) flightTotals.mochilaCarryOn += parseFloat(flight.precioAdultoMochilaCarryOn || '0');
    if (flight.mostrarPrecioAdultoMochilaBodega) flightTotals.mochilaBodega += parseFloat(flight.precioAdultoMochilaBodega || '0');
    // Compatibilidad: usar campo nuevo o legacy
    const showAdultoBodega = flight.mostrarPrecioAdultoMochilaCarryOnBodega ?? flight.mostrarPrecioAdultoMochilaCarryOnValija;
    const precioAdultoBodega = flight.precioAdultoMochilaCarryOnBodega || flight.precioAdultoMochilaCarryOnValija || '0';
    if (showAdultoBodega) flightTotals.mochilaCarryOnBodega += parseFloat(precioAdultoBodega);
    
    if (flight.mostrarPrecioMenorMochila) flightTotals.soloMochila += parseFloat(flight.precioMenorMochila || '0');
    if (flight.mostrarPrecioMenorMochilaCarryOn) flightTotals.mochilaCarryOn += parseFloat(flight.precioMenorMochilaCarryOn || '0');
    if (flight.mostrarPrecioMenorMochilaBodega) flightTotals.mochilaBodega += parseFloat(flight.precioMenorMochilaBodega || '0');
    const showMenorBodega = flight.mostrarPrecioMenorMochilaCarryOnBodega ?? flight.mostrarPrecioMenorMochilaCarryOnValija;
    const precioMenorBodega = flight.precioMenorMochilaCarryOnBodega || flight.precioMenorMochilaCarryOnValija || '0';
    if (showMenorBodega) flightTotals.mochilaCarryOnBodega += parseFloat(precioMenorBodega);
  });

  // Helper para verificar si un vuelo tiene algún precio de equipaje configurado
  const flightHasAnyPrice = (f: Flight) => {
    return f.mostrarPrecioAdultoMochila || f.mostrarPrecioAdultoMochilaCarryOn || 
           f.mostrarPrecioAdultoMochilaBodega || (f.mostrarPrecioAdultoMochilaCarryOnBodega ?? f.mostrarPrecioAdultoMochilaCarryOnValija) ||
           f.mostrarPrecioMenorMochila || f.mostrarPrecioMenorMochilaCarryOn || 
           f.mostrarPrecioMenorMochilaBodega || (f.mostrarPrecioMenorMochilaCarryOnBodega ?? f.mostrarPrecioMenorMochilaCarryOnValija);
  };

  // Determinar columnas globales para totales generales
  const globalShowMochila = flights.length > 0 && flights.every(f => {
    if (!flightHasAnyPrice(f)) return true;
    const hasAdulto = f.mostrarPrecioAdultoMochila || f.mostrarPrecioAdultoMochilaCarryOn || f.mostrarPrecioAdultoMochilaBodega || (f.mostrarPrecioAdultoMochilaCarryOnBodega ?? f.mostrarPrecioAdultoMochilaCarryOnValija);
    const hasMenor = f.mostrarPrecioMenorMochila || f.mostrarPrecioMenorMochilaCarryOn || f.mostrarPrecioMenorMochilaBodega || (f.mostrarPrecioMenorMochilaCarryOnBodega ?? f.mostrarPrecioMenorMochilaCarryOnValija);
    return (hasAdulto ? f.mostrarPrecioAdultoMochila : true) && (hasMenor ? f.mostrarPrecioMenorMochila : true);
  });
  const globalShowMochilaCarryOn = flights.length > 0 && flights.every(f => {
    if (!flightHasAnyPrice(f)) return true;
    const hasAdulto = f.mostrarPrecioAdultoMochila || f.mostrarPrecioAdultoMochilaCarryOn || f.mostrarPrecioAdultoMochilaBodega || (f.mostrarPrecioAdultoMochilaCarryOnBodega ?? f.mostrarPrecioAdultoMochilaCarryOnValija);
    const hasMenor = f.mostrarPrecioMenorMochila || f.mostrarPrecioMenorMochilaCarryOn || f.mostrarPrecioMenorMochilaBodega || (f.mostrarPrecioMenorMochilaCarryOnBodega ?? f.mostrarPrecioMenorMochilaCarryOnValija);
    return (hasAdulto ? f.mostrarPrecioAdultoMochilaCarryOn : true) && (hasMenor ? f.mostrarPrecioMenorMochilaCarryOn : true);
  });
  const globalShowMochilaBodega = flights.length > 0 && flights.every(f => {
    if (!flightHasAnyPrice(f)) return true;
    const hasAdulto = f.mostrarPrecioAdultoMochila || f.mostrarPrecioAdultoMochilaCarryOn || f.mostrarPrecioAdultoMochilaBodega || (f.mostrarPrecioAdultoMochilaCarryOnBodega ?? f.mostrarPrecioAdultoMochilaCarryOnValija);
    const hasMenor = f.mostrarPrecioMenorMochila || f.mostrarPrecioMenorMochilaCarryOn || f.mostrarPrecioMenorMochilaBodega || (f.mostrarPrecioMenorMochilaCarryOnBodega ?? f.mostrarPrecioMenorMochilaCarryOnValija);
    return (hasAdulto ? f.mostrarPrecioAdultoMochilaBodega : true) && (hasMenor ? f.mostrarPrecioMenorMochilaBodega : true);
  });
  const globalShowMochilaCarryOnBodega = flights.length > 0 && flights.every(f => {
    if (!flightHasAnyPrice(f)) return true;
    const hasAdulto = f.mostrarPrecioAdultoMochila || f.mostrarPrecioAdultoMochilaCarryOn || f.mostrarPrecioAdultoMochilaBodega || (f.mostrarPrecioAdultoMochilaCarryOnBodega ?? f.mostrarPrecioAdultoMochilaCarryOnValija);
    const hasMenor = f.mostrarPrecioMenorMochila || f.mostrarPrecioMenorMochilaCarryOn || f.mostrarPrecioMenorMochilaBodega || (f.mostrarPrecioMenorMochilaCarryOnBodega ?? f.mostrarPrecioMenorMochilaCarryOnValija);
    return (hasAdulto ? (f.mostrarPrecioAdultoMochilaCarryOnBodega ?? f.mostrarPrecioAdultoMochilaCarryOnValija) : true) && (hasMenor ? (f.mostrarPrecioMenorMochilaCarryOnBodega ?? f.mostrarPrecioMenorMochilaCarryOnValija) : true);
  });

  // Agrego helpers arriba de la función principal:
  const formatRegimen = (regimen: string) =>
    regimen
      ? regimen.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      : '';
  const formatTipoTraslado = (tipo: string) =>
    tipo
      ? tipo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      : '';

  // Agrupar subtotales por moneda para cada sección
  const accommodationTotals = groupAmountsByCurrency(accommodations, selectedCurrency, 'precioTotal');
  const transferTotals = groupAmountsByCurrency(transfers, selectedCurrency, 'precio');
  const serviceTotals = groupAmountsByCurrency(services, selectedCurrency, 'precio');
  const cruiseTotals = groupAmountsByCurrency(cruises, selectedCurrency, 'precio');

  // Calcular total general agrupando todas las monedas
  const allTotals: Record<string, number> = {};
  [accommodationTotals, transferTotals, serviceTotals, cruiseTotals].forEach(sectionTotals => {
    Object.entries(sectionTotals).forEach(([currency, amount]) => {
      allTotals[currency] = (allTotals[currency] || 0) + amount;
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Resumen y Totales
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Vuelos */}
        {formMode !== 'cruise' && (
        <section>
          <h3 className="font-semibold text-lg mb-2">Vuelos</h3>
          {flights.length === 0 ? (
            <div className="text-gray-500 italic">No hay vuelos cargados.</div>
          ) : (
            <div className="overflow-x-auto space-y-8">
              {flights.map((flight, idx) => {
                // Detectar compañía
                const compania = flight.compania || flight.aerolinea || "";
                // Helper para tipo de tarifa
                const formatTarifa = (tipo: string) => {
                  if (!tipo) return "";
                  return tipo
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase());
                };
                // Compatibilidad con campos legacy (Valija -> Bodega)
                const showAdultoBodega = flight.mostrarPrecioAdultoMochilaCarryOnBodega ?? flight.mostrarPrecioAdultoMochilaCarryOnValija;
                const showMenorBodega = flight.mostrarPrecioMenorMochilaCarryOnBodega ?? flight.mostrarPrecioMenorMochilaCarryOnValija;
                const precioAdultoBodega = flight.precioAdultoMochilaCarryOnBodega || flight.precioAdultoMochilaCarryOnValija || '0';
                const precioMenorBodega = flight.precioMenorMochilaCarryOnBodega || flight.precioMenorMochilaCarryOnValija || '0';

                // Detectar si hay precios para cada tipo de pasajero Y si hay pasajeros de ese tipo
                const hasAdulto = (clientData?.cantidadAdultos || 0) > 0 && (flight.mostrarPrecioAdultoMochila || flight.mostrarPrecioAdultoMochilaCarryOn || flight.mostrarPrecioAdultoMochilaBodega || showAdultoBodega);
                const hasMenor = (clientData?.cantidadMenores || 0) > 0 && (flight.mostrarPrecioMenorMochila || flight.mostrarPrecioMenorMochilaCarryOn || flight.mostrarPrecioMenorMochilaBodega || showMenorBodega);
                const hasInfante = (clientData?.cantidadInfantes || 0) > 0 && flight.mostrarPrecioInfante && flight.precioInfante && parseFloat(flight.precioInfante) > 0;

                // Determinar qué columnas mostrar
                const showMochila = (flight.mostrarPrecioAdultoMochila || flight.mostrarPrecioMenorMochila);
                const showMochilaCarryOn = (flight.mostrarPrecioAdultoMochilaCarryOn || flight.mostrarPrecioMenorMochilaCarryOn);
                const showMochilaBodega = (flight.mostrarPrecioAdultoMochilaBodega || flight.mostrarPrecioMenorMochilaBodega);
                const showMochilaCarryOnBodega = (showAdultoBodega || showMenorBodega);

                // Subtotales por vuelo
                const subtotalAdulto =
                  (flight.mostrarPrecioAdultoMochila ? parseFloat(flight.precioAdultoMochila || '0') : 0) +
                  (flight.mostrarPrecioAdultoMochilaCarryOn ? parseFloat(flight.precioAdultoMochilaCarryOn || '0') : 0) +
                  (flight.mostrarPrecioAdultoMochilaBodega ? parseFloat(flight.precioAdultoMochilaBodega || '0') : 0) +
                  (showAdultoBodega ? parseFloat(precioAdultoBodega) : 0);
                const subtotalMenor =
                  (flight.mostrarPrecioMenorMochila ? parseFloat(flight.precioMenorMochila || '0') : 0) +
                  (flight.mostrarPrecioMenorMochilaCarryOn ? parseFloat(flight.precioMenorMochilaCarryOn || '0') : 0) +
                  (flight.mostrarPrecioMenorMochilaBodega ? parseFloat(flight.precioMenorMochilaBodega || '0') : 0) +
                  (showMenorBodega ? parseFloat(precioMenorBodega) : 0);
                const subtotalInfante = hasInfante ? parseFloat(flight.precioInfante || '0') : 0;

                const monedaVuelo = flight.useCustomCurrency && flight.currency ? flight.currency : selectedCurrency;

                return (
                  <div key={flight.id} className="mb-6">
                    <div className="font-semibold mb-1 flex flex-wrap gap-2 items-center">
                      <span>{`Vuelo${(flight.destino || destinationData?.ciudad) ? ` a ${flight.destino || destinationData?.ciudad}` : ` ${idx + 1}`}`}</span>
                      {compania && <span className="text-gray-700 font-semibold">{compania}</span>}
                      <span className="text-gray-500">|</span>
                      <span className="capitalize">{formatTarifa(flight.tipoTarifa)}</span>
                    </div>
                    <table className={`${!isSidebarVisible ? 'min-w-[900px] border text-base' : 'min-w-[700px] border text-sm'} mb-2 mx-auto`} style={{ marginLeft: 'auto', marginRight: 'auto' }}>
                      <thead>
                        <tr className="bg-gray-50 text-center">
                          <th className={`${!isSidebarVisible ? 'px-4 py-2' : 'px-2 py-1'} border`}>Tipo de pasajero</th>
                          {showMochila && <th className={`${!isSidebarVisible ? 'px-4 py-2' : 'px-2 py-1'} border`}>Solo mochila</th>}
                          {showMochilaCarryOn && <th className={`${!isSidebarVisible ? 'px-4 py-2' : 'px-2 py-1'} border`}>Mochila + Carry On</th>}
                          {showMochilaBodega && <th className={`${!isSidebarVisible ? 'px-4 py-2' : 'px-2 py-1'} border`}>Mochila + Bodega</th>}
                          {showMochilaCarryOnBodega && <th className={`${!isSidebarVisible ? 'px-4 py-2' : 'px-2 py-1'} border`}>Mochila + Carry On + Bodega</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {hasAdulto && (
                          <tr className="text-center">
                            <td className={`border ${!isSidebarVisible ? 'px-4 py-2' : 'px-2 py-1'} font-medium`}>Adulto (x{clientData?.cantidadAdultos || 1})</td>
                            {showMochila && <td className={`border ${!isSidebarVisible ? 'px-4 py-2' : 'px-2 py-1'}`}>{flight.mostrarPrecioAdultoMochila ? formatCurrencyBy(parseFloat(flight.precioAdultoMochila || '0') * (clientData?.cantidadAdultos || 1), monedaVuelo) : '-'}</td>}
                            {showMochilaCarryOn && <td className={`border ${!isSidebarVisible ? 'px-4 py-2' : 'px-2 py-1'}`}>{flight.mostrarPrecioAdultoMochilaCarryOn ? formatCurrencyBy(parseFloat(flight.precioAdultoMochilaCarryOn || '0') * (clientData?.cantidadAdultos || 1), monedaVuelo) : '-'}</td>}
                            {showMochilaBodega && <td className={`border ${!isSidebarVisible ? 'px-4 py-2' : 'px-2 py-1'}`}>{flight.mostrarPrecioAdultoMochilaBodega ? formatCurrencyBy(parseFloat(flight.precioAdultoMochilaBodega || '0') * (clientData?.cantidadAdultos || 1), monedaVuelo) : '-'}</td>}
                            {showMochilaCarryOnBodega && <td className={`border ${!isSidebarVisible ? 'px-4 py-2' : 'px-2 py-1'}`}>{showAdultoBodega ? formatCurrencyBy(parseFloat(precioAdultoBodega) * (clientData?.cantidadAdultos || 1), monedaVuelo) : '-'}</td>}
                          </tr>
                        )}
                        {hasMenor && (
                          <tr className="text-center">
                            <td className={`border ${!isSidebarVisible ? 'px-4 py-2' : 'px-2 py-1'} font-medium`}>Menor (x{clientData?.cantidadMenores || 1})</td>
                            {showMochila && <td className={`border ${!isSidebarVisible ? 'px-4 py-2' : 'px-2 py-1'}`}>{flight.mostrarPrecioMenorMochila ? formatCurrencyBy(parseFloat(flight.precioMenorMochila || '0') * (clientData?.cantidadMenores || 1), monedaVuelo) : '-'}</td>}
                            {showMochilaCarryOn && <td className={`border ${!isSidebarVisible ? 'px-4 py-2' : 'px-2 py-1'}`}>{flight.mostrarPrecioMenorMochilaCarryOn ? formatCurrencyBy(parseFloat(flight.precioMenorMochilaCarryOn || '0') * (clientData?.cantidadMenores || 1), monedaVuelo) : '-'}</td>}
                            {showMochilaBodega && <td className={`border ${!isSidebarVisible ? 'px-4 py-2' : 'px-2 py-1'}`}>{flight.mostrarPrecioMenorMochilaBodega ? formatCurrencyBy(parseFloat(flight.precioMenorMochilaBodega || '0') * (clientData?.cantidadMenores || 1), monedaVuelo) : '-'}</td>}
                            {showMochilaCarryOnBodega && <td className={`border ${!isSidebarVisible ? 'px-4 py-2' : 'px-2 py-1'}`}>{showMenorBodega ? formatCurrencyBy(parseFloat(precioMenorBodega) * (clientData?.cantidadMenores || 1), monedaVuelo) : '-'}</td>}
                          </tr>
                        )}
                        {hasInfante && (
                          <tr className="text-center">
                            <td className={`border ${!isSidebarVisible ? 'px-4 py-2' : 'px-2 py-1'} font-medium`}>Infante (x{clientData?.cantidadInfantes || 1})</td>
                            <td className={`border ${!isSidebarVisible ? 'px-4 py-2' : 'px-2 py-1'}`} colSpan={((showMochila ? 1 : 0) + (showMochilaCarryOn ? 1 : 0) + (showMochilaBodega ? 1 : 0) + (showMochilaCarryOnBodega ? 1 : 0))}>{formatCurrencyBy(parseFloat(flight.precioInfante || '0') * (clientData?.cantidadInfantes || 1), monedaVuelo)}</td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-100 font-semibold text-center">
                          <td className={`border ${!isSidebarVisible ? 'px-4 py-2' : 'px-2 py-1'} text-center font-semibold`}>
                            {`Subtotal vuelo${(flight.destino || destinationData?.ciudad) ? ` a ${flight.destino || destinationData?.ciudad}` : ` ${idx + 1}`}`}
                          </td>
                          {showMochila && <td className={`border ${!isSidebarVisible ? 'px-4 py-2' : 'px-2 py-1'} font-semibold`}>{formatCurrencyBy((flight.mostrarPrecioAdultoMochila ? parseFloat(flight.precioAdultoMochila || '0') * (clientData?.cantidadAdultos || 1) : 0) + (flight.mostrarPrecioMenorMochila ? parseFloat(flight.precioMenorMochila || '0') * (clientData?.cantidadMenores || 1) : 0) + (hasInfante ? parseFloat(flight.precioInfante || '0') * (clientData?.cantidadInfantes || 1) : 0), monedaVuelo)}</td>}
                          {showMochilaCarryOn && <td className={`border ${!isSidebarVisible ? 'px-4 py-2' : 'px-2 py-1'} font-semibold`}>{formatCurrencyBy((flight.mostrarPrecioAdultoMochilaCarryOn ? parseFloat(flight.precioAdultoMochilaCarryOn || '0') * (clientData?.cantidadAdultos || 1) : 0) + (flight.mostrarPrecioMenorMochilaCarryOn ? parseFloat(flight.precioMenorMochilaCarryOn || '0') * (clientData?.cantidadMenores || 1) : 0) + (hasInfante ? parseFloat(flight.precioInfante || '0') * (clientData?.cantidadInfantes || 1) : 0), monedaVuelo)}</td>}
                          {showMochilaBodega && <td className={`border ${!isSidebarVisible ? 'px-4 py-2' : 'px-2 py-1'} font-semibold`}>{formatCurrencyBy((flight.mostrarPrecioAdultoMochilaBodega ? parseFloat(flight.precioAdultoMochilaBodega || '0') * (clientData?.cantidadAdultos || 1) : 0) + (flight.mostrarPrecioMenorMochilaBodega ? parseFloat(flight.precioMenorMochilaBodega || '0') * (clientData?.cantidadMenores || 1) : 0) + (hasInfante ? parseFloat(flight.precioInfante || '0') * (clientData?.cantidadInfantes || 1) : 0), monedaVuelo)}</td>}
                          {showMochilaCarryOnBodega && <td className={`border ${!isSidebarVisible ? 'px-4 py-2' : 'px-2 py-1'} font-semibold`}>{formatCurrencyBy((showAdultoBodega ? parseFloat(precioAdultoBodega) * (clientData?.cantidadAdultos || 1) : 0) + (showMenorBodega ? parseFloat(precioMenorBodega) * (clientData?.cantidadMenores || 1) : 0) + (hasInfante ? parseFloat(flight.precioInfante || '0') * (clientData?.cantidadInfantes || 1) : 0), monedaVuelo)}</td>}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        )}

        {/* Alojamiento */}
        {(formMode === 'full' || formMode === 'flight_hotel') && (
        <section>
          <h3 className="font-semibold text-lg mb-2">Alojamiento</h3>
          {accommodations.length === 0 ? (
            <div className="text-gray-500 italic">No hay alojamientos cargados.</div>
          ) : (
            <div className="space-y-2">
              {accommodations.map((acc, idx) => {
                const monedaAloj = acc.useCustomCurrency && acc.currency ? acc.currency : selectedCurrency;
                return (
                  <div key={acc.id} className={`border rounded p-3 bg-gray-50 ${!isSidebarVisible ? 'text-lg ' : 'text-base'}`}>
                    <div className="font-semibold">{acc.nombre} ({acc.ciudad})</div>
                    <div className={`text-gray-600 mb-1 ${!isSidebarVisible ? 'text-sm ' : 'text-xs'}`}>Check-in: {acc.checkin} | Check-out: {acc.checkout} | Cantidad noches: {acc.cantidadNoches || 1}</div>
                    <div className={`font-semibold ${!isSidebarVisible ? 'text-base ' : 'text-sm'}`}>Habitaciones:</div>
                    <ul className={`ml-4 ${!isSidebarVisible ? 'text-base ' : 'text-sm'}`}>
                      {acc.habitaciones.map((room: any) => (
                        <li key={room.id}>
                          <span className="font-medium">{room.tipoHabitacion}</span> - {formatRegimen(room.regimen)} - {formatCurrencyBy(room.precio, monedaAloj)}
                        </li>
                      ))}
                    </ul>
                    <div className="text-right font-semibold mt-1">
                      Subtotal: {formatCurrencyBy(acc.precioTotal, monedaAloj)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        )}

        {/* Traslados */}
        {formMode === 'full' && (
        <section>
          <h3 className="font-semibold text-lg mb-2">Traslados</h3>
          {transfers.length === 0 ? (
            <div className="text-gray-500 italic">No hay traslados cargados.</div>
          ) : (
            <div className="space-y-2">
              {transfers.map((transfer, idx) => {
                const monedaTras = transfer.useCustomCurrency && transfer.currency ? transfer.currency : selectedCurrency;
                return (
                  <div key={transfer.id} className={`border rounded p-3 bg-gray-50 ${!isSidebarVisible ? 'text-lg ' : 'text-base'}`}>
                    <div className="font-semibold">{transfer.nombre}</div>
                    <div className={`text-gray-600 mb-1 ${!isSidebarVisible ? 'text-sm ' : 'text-xs'}`}>{transfer.origen} → {transfer.destino} | {transfer.tipoTraslado} | {transfer.fecha} {transfer.hora}</div>
                    <div className="text-right font-semibold mt-1">Precio: {formatCurrencyBy(transfer.precio, monedaTras)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        )}

        {/* Servicios adicionales */}
        {formMode === 'full' && (
        <section>
          <h3 className="font-semibold text-lg mb-2">Servicios adicionales</h3>
          {services.length === 0 ? (
            <div className="text-gray-500 italic">No hay servicios cargados.</div>
          ) : (
            <div className="space-y-2">
              {services.map((service, idx) => {
                const monedaServ = service.useCustomCurrency && service.currency ? service.currency : selectedCurrency;
                return (
                  <div key={service.id} className={`border rounded p-3 bg-gray-50 ${!isSidebarVisible ? 'text-lg ' : 'text-base'}`}>
                    <div className="font-semibold">{service.nombre}</div>
                    <div className={`text-gray-600 mb-1 ${!isSidebarVisible ? 'text-sm ' : 'text-xs'}`}>{service.fecha} | {service.descripcion}</div>
                    <div>{service.textoLibre}</div>
                    <div className="text-right font-semibold mt-1">Precio: {formatCurrencyBy(service.precio, monedaServ)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        )}

        {/* Cruceros */}
        {(formMode === 'cruise' || formMode === 'full') && (
        <section>
          <h3 className="font-semibold text-lg mb-2">Cruceros</h3>
          {cruises.length === 0 ? (
            <div className="text-gray-500 italic">No hay cruceros cargados.</div>
          ) : (
            <div className="space-y-2">
              {cruises.map((cruise, idx) => {
                const monedaCrucero = cruise.useCustomCurrency && cruise.currency ? cruise.currency : selectedCurrency;
                return (
                  <div key={cruise.id} className={`border rounded p-3 bg-gray-50 ${!isSidebarVisible ? 'text-lg ' : 'text-base'}`}>
                    <div className="font-semibold">{cruise.empresa} - {cruise.nombreBarco}</div>
                    <div className={`text-gray-600 mb-1 ${!isSidebarVisible ? 'text-sm ' : 'text-xs'}`}>Destino: {cruise.destino}</div>
                    <div className={`text-gray-600 mb-1 ${!isSidebarVisible ? 'text-sm ' : 'text-xs'}`}>Partida: {cruise.fechaPartida} | Regreso: {cruise.fechaRegreso}</div>
                    <div className={`text-gray-600 mb-1 ${!isSidebarVisible ? 'text-sm ' : 'text-xs'}`}>Cabina: {cruise.tipoCabina} | Días: {cruise.cantidadDias}</div>
                    <div className="text-right font-semibold mt-1">Precio: {formatCurrencyBy(cruise.precio, monedaCrucero)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        )}

        {/* Totales */}
        <section>
          <h3 className="font-bold text-lg mb-2">Resumen de Totales</h3>
          <div className="bg-gray-50 rounded p-3 max-w-md mx-auto">
            {formMode !== 'flight' && accommodations.length > 0 && (
              <div className="mb-1">
                <span className="font-medium">Subtotal alojamiento:</span>
                <ul>
                  {accommodations.map(acc => {
                    const moneda = acc.useCustomCurrency && acc.currency ? acc.currency : selectedCurrency;
                    return (
                      <li key={acc.id} className="flex justify-between">
                        <span>{acc.nombre}</span>
                        <span>{formatCurrencyBy(acc.precioTotal, moneda)}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {formMode === 'full' && transfers.length > 0 && (
              <div className="mb-1">
                <span className="font-medium">Subtotal traslados:</span>
                <ul>
                  {transfers.map(transfer => {
                    const moneda = transfer.useCustomCurrency && transfer.currency ? transfer.currency : selectedCurrency;
                    return (
                      <li key={transfer.id} className="flex justify-between">
                        <span>{transfer.nombre}</span>
                        <span>{formatCurrencyBy(transfer.precio, moneda)}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {formMode === 'full' && services.length > 0 && (
              <div className="mb-1">
                <span className="font-medium">Subtotal servicios:</span>
                <ul>
                  {services.map(service => {
                    const moneda = service.useCustomCurrency && service.currency ? service.currency : selectedCurrency;
                    return (
                      <li key={service.id} className="flex justify-between">
                        <span>{service.nombre}</span>
                        <span>{formatCurrencyBy(service.precio, moneda)}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {(formMode === 'cruise' || formMode === 'full') && cruises.length > 0 && (
              <div className="mb-1">
                <span className="font-medium">Subtotal cruceros:</span>
                <ul>
                  {cruises.map(cruise => {
                    const moneda = cruise.useCustomCurrency && cruise.currency ? cruise.currency : selectedCurrency;
                    return (
                      <li key={cruise.id} className="flex justify-between">
                        <span>{cruise.nombreBarco}</span>
                        <span>{formatCurrencyBy(cruise.precio, moneda)}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <div className="flex flex-col font-bold text-lg mt-2">
              <span>Total general:</span>
              <ul>
                {Object.entries(allTotals).map(([currency, amount]) => (
                  <li key={currency} className="flex justify-between">
                    <span></span>
                    <span>{formatCurrencyBy(amount, currency)}</span>
                  </li>
                ))}
              </ul>
            </div>
            {Object.keys(allTotals).length === 1 && (
              <div className="mt-3">
                <Label htmlFor="totalOverride" className="text-xs font-medium">
                  Total a mostrar en el PDF
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="totalOverride"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      summaryData.totalOverride !== undefined && summaryData.totalOverride !== null
                        ? summaryData.totalOverride
                        : ""
                    }
                    onChange={(e) => {
                      if (onSummaryDataChange) {
                        const value = e.target.value
                        if (value === "") {
                          onSummaryDataChange({ totalOverride: undefined })
                        } else {
                          const num = parseFloat(value.replace(",", "."))
                          if (!isNaN(num)) {
                            onSummaryDataChange({ totalOverride: num })
                          }
                        }
                      }
                    }}
                    className="h-8 text-sm"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Si lo dejas vacío, se usa la suma automática de los servicios.
                </p>
              </div>
            )}
            
            {/* Checkbox para mostrar/ocultar total en PDF */}
            <div className="mt-4 p-3 bg-white rounded border">
              <div className="flex items-center space-x-2">
                <input
                  id="mostrarTotalPdf"
                  type="checkbox"
                  checked={summaryData.mostrarTotal}
                  onChange={(e) => {
                    if (onSummaryDataChange) {
                      onSummaryDataChange({ mostrarTotal: e.target.checked });
                    }
                  }}
                  className="accent-blue-600 h-4 w-4"
                />
                <Label htmlFor="mostrarTotalPdf" className="text-sm font-medium">
                  Mostrar precio total en el PDF
                </Label>
              </div>
            </div>
            
            {/* Checkbox para mostrar/ocultar nota de tarifas de vuelos */}
            <div className="mt-2 p-3 bg-white rounded border">
              <div className="flex items-center space-x-2">
                <input
                  id="mostrarNotaTarifas"
                  type="checkbox"
                  checked={summaryData.mostrarNotaTarifas}
                  onChange={(e) => {
                    if (onSummaryDataChange) {
                      onSummaryDataChange({ mostrarNotaTarifas: e.target.checked });
                    }
                  }}
                  className="accent-blue-600 h-4 w-4"
                />
                <Label htmlFor="mostrarNotaTarifas" className="text-sm font-medium">
                  Mostrar nota de tarifas de vuelos en el PDF
                </Label>
              </div>
            </div>
            
            {/* Checkbox para mostrar/ocultar nota del precio total */}
            <div className="mt-2 p-3 bg-white rounded border">
              <div className="flex items-center space-x-2">
                <input
                  id="mostrarNotaPrecioTotal"
                  type="checkbox"
                  checked={summaryData.mostrarNotaPrecioTotal}
                  onChange={(e) => {
                    if (onSummaryDataChange) {
                      onSummaryDataChange({ mostrarNotaPrecioTotal: e.target.checked });
                    }
                  }}
                  className="accent-blue-600 h-4 w-4"
                />
                <Label htmlFor="mostrarNotaPrecioTotal" className="text-sm font-medium">
                  Mostrar nota del precio total en el PDF
                </Label>
              </div>
            </div>
            
            <div className="mt-2">
              <Alert variant="default" className="text-xs text-gray-600 text-center italic">
                El total general <b>no incluye los vuelos</b>. Consulta la tabla de arriba para ver los precios de vuelos por persona y tipo de equipaje.
              </Alert>
            </div>
            <div className="flex justify-center mt-6">
              <Button
                onClick={onGeneratePdf}
                className="w-full max-w-xs py-3 text-lg font-semibold rounded-xl shadow-md bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                size="lg"
                disabled={isGenerating}
              >
                <FileSpreadsheet className="h-5 w-5" />
                {isGenerating ? "Generando vista previa..." : "Generar vista previa"}
              </Button>
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  )
}
