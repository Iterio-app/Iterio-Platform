"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FileText, Search, Calendar, DollarSign, Eye, Trash2, Download, Plus, Pencil, RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { useQuotes } from "@/hooks/use-quotes"
import type { User } from "@supabase/supabase-js"
import type { Quote } from "@/lib/supabase"
import { groupAmountsByCurrency } from "@/lib/utils"

interface QuotesHistoryProps {
  user: User
  onLoadQuote?: (quote: Quote) => void
  onCreateNew?: () => void
}

export default function QuotesHistory({ user, onLoadQuote, onCreateNew }: QuotesHistoryProps) {
  const { quotes, isLoading, error, deleteQuote, fetchQuoteById, refetch } = useQuotes(user)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null)
  const [generatingPreview, setGeneratingPreview] = useState<string | null>(null)
  const [loadingQuoteId, setLoadingQuoteId] = useState<string | null>(null)

  // ✅ Hacer fetch cuando el componente se monta (usuario va a la tab de historial)
  useEffect(() => {
    refetch()
  }, [])

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch =
      quote.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.destination?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || quote.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-200 text-green-800 hover:bg-green-400"
      case "generated":
        return "bg-yellow-200 text-yellow-800 hover:bg-yellow-400"
      case "sent":
        return "bg-blue-100 text-blue-800 hover:bg-blue-300"
      case "draft":
        return "bg-gray-200 text-gray-800 hover:bg-gray-400"
      default:
        return "bg-gray-200 text-gray-800 hover:bg-gray-400"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Descargada"
      case "generated":
        return "Generada"
      case "sent":
        return "Enviada"
      case "draft":
        return "Borrador"
      default:
        return "Borrador"
    }
  }

  const handleViewPreview = async (quote: Quote) => {
    setGeneratingPreview(quote.id)
    try {
      // --- Replicar lógica de cálculo de totales ---
      const flights = quote.flights_data || [];
      const accommodations = quote.accommodations_data || [];
      const transfers = quote.transfers_data || [];
      const services = quote.services_data || [];
      const cruises = quote.cruises_data || [];

      const totalesPorMoneda = [...flights, ...accommodations, ...transfers, ...services, ...cruises].reduce((acc, item) => {
        if (item && typeof item.precio === 'number' && item.moneda) {
          acc[item.moneda] = (acc[item.moneda] || 0) + item.precio;
        }
        return acc;
      }, {} as Record<string, number>);

      const quoteDataForPdf = {
        destination: {
          pais: quote.destination?.split(',')[1]?.trim() || '',
          ciudad: quote.destination?.split(',')[0]?.trim() || '',
          año: new Date(quote.created_at).getFullYear().toString(),
          meses: quote.summary_data?.meses || []
        },
        client: {
          cantidadPasajeros: quote.summary_data?.cantidadPasajeros || 0,
          cantidadAdultos: quote.summary_data?.cantidadAdultos || 0,
          cantidadMenores: quote.summary_data?.cantidadMenores || 0,
          cantidadInfantes: quote.summary_data?.cantidadInfantes || 0
        },
        flights,
        accommodations,
        transfers,
        services,
        cruises,
        quoteTitle: quote.title,
        clientName: quote.client_name || '',
        selectedCurrency: quote.summary_data?.currency || 'USD',
        summary: quote.summary_data || {},
        formMode: quote.summary_data?.formMode || 'full',
        mostrarCantidadPasajeros: quote.summary_data?.mostrarCantidadPasajeros ?? true,
        totalesPorMoneda,
        totales: {
          ...(quote.summary_data?.totales || {}),
          total: Object.values(totalesPorMoneda).reduce((a, b) => Number(a) + Number(b), 0)
        },
        observaciones: quote.summary_data?.observaciones || ''
      };

      // Regenerar vista previa usando los datos guardados
      // Llamar a la API para generar el PDF con la estructura correcta
      // Transformar los datos al formato esperado por la API
      const transformToApiFormat = () => {
        // Obtener requisitos migratorios de los vuelos
        const requisitosMigratorios = [
          ...new Set(
            (quoteDataForPdf.flights || [])
              .flatMap((v: any) => v.requisitosMigratorios || [])
              .filter(Boolean)
          )
        ];
        
        // Obtener datos del cliente con valores por defecto y formato correcto
        const clientData = {
          cantidad_pasajeros: Number(quoteDataForPdf.client?.cantidadPasajeros) || 0,
          cantidad_adultos: Number(quoteDataForPdf.client?.cantidadAdultos) || 0,
          cantidad_menores: Number(quoteDataForPdf.client?.cantidadMenores) || 0,
          cantidad_infantes: Number(quoteDataForPdf.client?.cantidadInfantes) || 0,
          // Usar el valor del checkbox del formulario para mostrar/ocultar la sección
          mostrarCantidadPasajeros: Boolean(quoteDataForPdf.mostrarCantidadPasajeros)
        };
        
        // Calcular el total de pasajeros si no está definido
        const cantidadPasajeros = clientData.cantidad_pasajeros > 0 
          ? clientData.cantidad_pasajeros 
          : clientData.cantidad_adultos + clientData.cantidad_menores + clientData.cantidad_infantes;
          
        // Asegurarse de que el total de pasajeros esté actualizado
        clientData.cantidad_pasajeros = cantidadPasajeros;
        
        // El objeto cliente ya incluye el flag mostrarCantidadPasajeros del formulario
        const cliente = { ...clientData };
        
        // Transformar vuelos
        const vuelos = (quoteDataForPdf.flights || []).map((vuelo: any) => {
          const opciones = [];
          
          // Agregar opciones de equipaje según corresponda
          if (vuelo.precioAdultoMochila) {
            opciones.push({
              tipo: 'mochila',
              precio: Number(vuelo.precioAdultoMochila) || 0,
              pasajero: 'adulto'
            });
          }
          
          if (vuelo.precioMenorMochila) {
            opciones.push({
              tipo: 'mochila',
              precio: Number(vuelo.precioMenorMochila) || 0,
              pasajero: 'menor'
            });
          }
          
          if (vuelo.precioAdultoMochilaCarryOn) {
            opciones.push({
              tipo: 'mochilaCarryOn',
              precio: Number(vuelo.precioAdultoMochilaCarryOn) || 0,
              pasajero: 'adulto'
            });
          }
          
          if (vuelo.precioMenorMochilaCarryOn) {
            opciones.push({
              tipo: 'mochilaCarryOn',
              precio: Number(vuelo.precioMenorMochilaCarryOn) || 0,
              pasajero: 'menor'
            });
          }
          
          if (vuelo.precioInfante) {
            opciones.push({
              tipo: 'infante',
              precio: Number(vuelo.precioInfante) || 0,
              pasajero: 'infante'
            });
          }
          
          return {
            nombre: vuelo.nombre || '',
            fechaSalida: vuelo.fechaSalida || '',
            fechaRetorno: vuelo.fechaRetorno || '',
            tipoTarifa: vuelo.tipoTarifa || 'economy',
            imagenes: vuelo.imagenes || [],
            opciones,
            condicionesTarifa: vuelo.condicionesTarifa || [],
            textoLibre: vuelo.textoLibre || '',
            useCustomCurrency: vuelo.useCustomCurrency || false,
            currency: vuelo.currency || 'USD'
          };
        });

        // Transformar hoteles
        const hoteles = (quoteDataForPdf.accommodations || []).map((hotel: any) => {
          // Calcular el precio total sumando las habitaciones si no existe
          const precioTotalHabitaciones = (hotel.habitaciones || []).reduce(
            (sum: number, hab: any) => sum + (Number(hab.precio) || 0), 0
          );
          
          return {
            nombre: hotel.nombre || '',
            ciudad: hotel.ciudad || '',
            checkin: hotel.checkin || '',
            checkout: hotel.checkout || '',
            cantidadHabitaciones: hotel.cantidadHabitaciones || 1,
            habitaciones: (hotel.habitaciones || []).map((hab: any) => ({
              id: hab.id || '',
              precio: String(hab.precio || 0),
              regimen: hab.regimen || 'desayuno',
              regimenTouched: hab.regimenTouched !== false, // true por defecto
              tipoHabitacion: hab.tipoHabitacion || 'Doble'
            })),
            precioTotal: Number(hotel.precioTotal) || precioTotalHabitaciones,
            mostrarPrecio: hotel.mostrarPrecio !== false,
            imagenes: hotel.imagenes || [],
            textoLibre: hotel.textoLibre || '',
            useCustomCurrency: hotel.useCustomCurrency || false,
            currency: hotel.currency || 'USD',
            cantidadNoches: hotel.cantidadNoches || 0
          };
        });

        // Obtener totales por moneda
        const totalesPorMoneda: Record<string, number> = {};
        
        // Sumar solo los totales de hoteles (no incluir vuelos en el total)
        hoteles.forEach((hotel: { currency?: string; precioTotal?: number; mostrarPrecio?: boolean }) => {
          // Solo sumar si mostrarPrecio es true
          if (hotel.mostrarPrecio !== false) {
            const moneda = hotel.currency || 'USD';
            totalesPorMoneda[moneda] = (totalesPorMoneda[moneda] || 0) + (hotel.precioTotal || 0);
          }
        });

        // Calcular total general (solo hoteles)
        const totalGeneral = Object.values(totalesPorMoneda).reduce((sum: number, val: number) => sum + val, 0);
        
        // Obtener requisitos migratorios de los vuelos si no hay en la cotización
        const requisitosFinales = requisitosMigratorios.length > 0 
          ? requisitosMigratorios 
          : ['No se especificaron requisitos migratorios'];
          
        // Asegurar que los totales por moneda incluyan todos los servicios
        const monedasUnicas = new Set([
          ...hoteles.map((h: any) => h.currency || 'USD'),
          ...(quoteDataForPdf.cruises || []).map((c: any) => c.currency || 'USD'),
          ...(quoteDataForPdf.services || []).map((s: any) => s.currency || 'USD')
        ]);
        
        // Inicializar totales por moneda
        monedasUnicas.forEach(moneda => {
          if (!totalesPorMoneda[moneda]) {
            totalesPorMoneda[moneda] = 0;
          }
        });

        return {
          data: {
            destino: {
              pais: quoteDataForPdf.destination?.pais || '',
              ciudad: quoteDataForPdf.destination?.ciudad || '',
              año: quoteDataForPdf.destination?.año || new Date().getFullYear().toString(),
              meses: quoteDataForPdf.destination?.meses || []
            },
            requisitosMigratorios: requisitosFinales,
            cliente: {
              cantidad_pasajeros: cantidadPasajeros,
              cantidad_adultos: Number(quoteDataForPdf.client?.cantidadAdultos || 0),
              cantidad_menores: Number(quoteDataForPdf.client?.cantidadMenores || 0),
              cantidad_infantes: Number(quoteDataForPdf.client?.cantidadInfantes || 0),
            },
            vuelos: [],
            hoteles: hoteles,
            traslados: quoteDataForPdf.transfers || [],
            actividades: quoteDataForPdf.services || [],
            cruceros: quoteDataForPdf.cruises || [],
            totales: {
              subtotal_vuelos: 0,
              subtotal_hoteles: hoteles
                .filter((h: { mostrarPrecio?: boolean }) => h.mostrarPrecio !== false)
                .reduce((sum: number, h: { precioTotal?: number }) => sum + (h.precioTotal || 0), 0),
              subtotal_traslados: 0,
              subtotal_actividades: 0,
              subtotal_cruceros: 0,
              subtotal: totalGeneral,
              total: totalGeneral,
              mostrar_total: true,
              mostrar_nota_tarifas: true,
              mostrar_nota_precio_total: true,
              currency: quoteDataForPdf.selectedCurrency || 'USD'
            },
            observaciones: quoteDataForPdf.observaciones || '',
            mostrarCantidadPasajeros: Boolean(quoteDataForPdf.mostrarCantidadPasajeros),
            totalesPorMoneda
          },
          template: {
            ...(quote.template_data || {
              primaryColor: '#2563eb',
              secondaryColor: '#64748b',
              fontFamily: 'Roboto',
              logo: null,
              agencyName: 'Tu Agencia de Viajes',
              agencyAddress: 'Dirección de la agencia',
              agencyPhone: '+1 234 567 8900',
              agencyEmail: 'info@tuagencia.com',
              validityText: 'Esta cotización es válida por 15 días desde la fecha de emisión.'
            })
          }
        };
      };

      const requestData = transformToApiFormat();

      // Depuración: Verificar datos que se enviarán
      console.log('Datos que se enviarán a la API:', JSON.stringify(requestData, null, 2));
      console.log('URL de la API:', '/api/generate-pdf');

      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })
      
      // Depuración: Verificar la respuesta
      console.log('Respuesta del servidor:', {
        ok: response.ok,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        redirected: response.redirected,
        type: response.type,
        url: response.url
      })

      if (!response.ok) {
        throw new Error("Error al regenerar la vista previa")
      }

      // Obtener el HTML como texto
      const html = await response.text()
      
      // Depuración: Verificar el contenido HTML
      console.log('Contenido HTML recibido:', html.substring(0, 500) + '...')

      // Crear un nuevo documento HTML con el contenido recibido
      const newWindow = window.open('', '_blank')
      
      if (!newWindow) {
        alert('Por favor permite las ventanas emergentes para este sitio e intenta de nuevo')
        return
      }
      
      // Escribir el contenido HTML en la nueva ventana
      newWindow.document.open()
      newWindow.document.write(html)
      newWindow.document.close()
      
      // Asegurarse de que el contenido se renderice correctamente
      newWindow.document.title = 'Vista Previa de Cotización'
    } catch (err) {
      console.error('Error al regenerar vista previa:', err)
      alert('Error al regenerar la vista previa. Los datos pueden estar incompletos.')
    } finally {
      setGeneratingPreview(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Cargando cotizaciones...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Mis Cotizaciones ({quotes.length})
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch(true)}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros y búsqueda */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por título, cliente o destino..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">Todos los estados</option>
            <option value="draft">Borradores</option>
            <option value="generated">Generadas</option>
            <option value="completed">Completadas</option>
            <option value="sent">Enviadas</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {filteredQuotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">
              {quotes.length === 0 ? "No tienes cotizaciones guardadas" : "No se encontraron cotizaciones"}
            </p>
            <p className="text-sm">
              {quotes.length === 0
                ? "Crea tu primera cotización para verla aquí"
                : "Intenta con otros términos de búsqueda"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuotes.map((quote) => {
              // Agrupar totales por moneda
              let allTotals: Record<string, number> = {};
              
              if (quote.summary_data?.totalesPorMoneda) {
                allTotals = quote.summary_data.totalesPorMoneda;
              } else {
                // Fallback para cotizaciones antiguas o si tenemos los datos completos
                const accommodationTotals = groupAmountsByCurrency(quote.accommodations_data || [], quote.summary_data?.currency || "USD", "precioTotal");
                const transferTotals = groupAmountsByCurrency(quote.transfers_data || [], quote.summary_data?.currency || "USD", "precio");
                const serviceTotals = groupAmountsByCurrency(quote.services_data || [], quote.summary_data?.currency || "USD", "precio");
                const cruiseTotals = groupAmountsByCurrency(quote.cruises_data || [], quote.summary_data?.currency || "USD", "precio");
                
                allTotals = { ...accommodationTotals };
                for (const [currency, amount] of Object.entries(transferTotals)) {
                  allTotals[currency] = (allTotals[currency] || 0) + amount;
                }
                for (const [currency, amount] of Object.entries(serviceTotals)) {
                  allTotals[currency] = (allTotals[currency] || 0) + amount;
                }
                for (const [currency, amount] of Object.entries(cruiseTotals)) {
                  allTotals[currency] = (allTotals[currency] || 0) + amount;
                }
              }

              // Obtener tipo de cotización directamente desde summary_data.formMode
              let tipoCotizacion = "Personalizada";
              
              if (quote.summary_data?.formMode) {
                switch (quote.summary_data.formMode) {
                  case 'flight': tipoCotizacion = "Vuelo"; break;
                  case 'flight_hotel': tipoCotizacion = "Vuelo + Alojamiento"; break;
                  case 'full': tipoCotizacion = "Itinerario completo"; break;
                  case 'cruise': tipoCotizacion = "Crucero"; break;
                }
              }
              // Si no hay formMode guardado, se muestra "Personalizada" (cotizaciones antiguas)

              return (
                <div key={quote.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-lg">{quote.title}</h3>
                        <Badge className={getStatusColor(quote.status || "draft")}>{getStatusText(quote.status || "draft")}</Badge>
                        <Badge variant="outline" className="ml-2 text-xs px-2 py-1">
                          {tipoCotizacion}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        {quote.destination && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Destino:</span>
                            <span>{quote.destination}</span>
                          </div>
                        )}
                        {quote.client_name && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Cliente:</span>
                            <span>{quote.client_name}</span>
                          </div>
                        )}
                        {/* Mostrar totales por moneda */}
                        {Object.keys(allTotals).length > 0 && (
                          <div className="flex items-center gap-1">
                            {Object.entries(allTotals).map(([currency, amount]) => (
                              <span key={currency} className="font-medium mr-2">{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(quote.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {onLoadQuote && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={loadingQuoteId === quote.id}
                          onClick={async () => {
                            try {
                              setLoadingQuoteId(quote.id)
                              console.log('📥 Cargando cotización completa para editar...')
                              const fullQuote = await fetchQuoteById(quote.id)
                              onLoadQuote(fullQuote)
                            } catch (error) {
                              console.error('Error al cargar cotización:', error)
                              alert('Error al cargar la cotización')
                            } finally {
                              setLoadingQuoteId(null)
                            }
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          {loadingQuoteId === quote.id ? 'Cargando...' : 'Editar'}
                        </Button>
                      )}
                      {quote.pdf_url ? (
                        <Button variant="outline" size="sm" onClick={() => window.open(quote.pdf_url!, "_blank") }>
                          <Download className="h-4 w-4 mr-1" />
                          Ver PDF
                        </Button>
                      ) : quote.status === "generated" ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewPreview(quote)}
                          disabled={generatingPreview === quote.id}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {generatingPreview === quote.id ? 'Generando...' : 'Ver vista previa'}
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowDeleteConfirm(true)
                          setQuoteToDelete(quote)
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      
      {/* Modal de confirmación de eliminación */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar cotización?</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            ¿Estás seguro de que quieres eliminar la cotización "{quoteToDelete?.title}"? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (quoteToDelete) {
                  deleteQuote(quoteToDelete.id)
                  setShowDeleteConfirm(false)
                  setQuoteToDelete(null)
                }
              }}
            >
              Eliminar
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
