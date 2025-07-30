"use client"
export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react"
import { Download, Eye, FileSpreadsheet, Save, EyeOff, Plus, CheckCircle, AlertCircle, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import TemplateCustomizer from "@/components/template-customizer"
import DestinationSection from "@/components/destination-section"
import ClientSection from "@/components/client-section"
import FlightsSection from "@/components/flights-section"
import AccommodationSection from "@/components/accommodation-section"
import TransfersSection from "@/components/transfers-section"
import ServicesSection from "@/components/services-section"
import SummarySection from "@/components/summary-section"
import QuotesHistory from "@/components/quotes-history"
import { LoginForm } from "@/components/auth/login-form"
import UserMenu from "@/components/auth/user-menu"
// import PdfGenerator from "@/components/pdf-generator"
import { supabase } from "@/lib/supabase"
import { useTemplates } from "@/hooks/use-templates"
import { useQuotes } from "@/hooks/use-quotes"
import type { Quote } from "@/lib/supabase"

// Definir tipos locales para evitar problemas de importación
type User = any
type Session = any
import { Stepper } from "@/components/stepper"
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { UnifiedSidebar } from "@/components/unified-sidebar"

import FloatingNewQuoteButton from "@/components/floating-new-quote-button"
import { FloatingSidebarButton } from "@/components/floating-sidebar-button"
import SaveStatusIndicator from "@/components/save-status-indicator"
import { useToast } from "@/hooks/use-toast"
import TemplatesManager from "@/components/templates-manager";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { FormDataForSidebar, ProcessingStatus, Template } from "@/lib/types";

export default function TravelQuoteGenerator() {
  // --- TODOS LOS HOOKS VAN AQUÍ ---
  const [user, setUser] = useState<User | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("form")
  const [isDownloading, setIsDownloading] = useState(false)
  const [currentQuoteId, setCurrentQuoteId] = useState<string | null>(null)
  const [quoteTitle, setQuoteTitle] = useState("")
  const [clientName, setClientName] = useState("")
  const [showPdfGenerator, setShowPdfGenerator] = useState(false)
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasHandledTabParam, setHasHandledTabParam] = useState(false);
  
  // Estados para auto-guardado
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  
  // Estado global para funcionalidades habilitadas (fácil de extender)
  const [featuresEnabled, setFeaturesEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('featuresEnabled');
      if (stored) return JSON.parse(stored);
    }
    return { sidebar: true };
  });

  // Estado de visibilidad del sidebar unificado
  const [showUnifiedSidebar, setShowUnifiedSidebar] = useState(true);

  // Calcular errores de ayuda y elementos del resumen
  const calculateHelpErrors = () => {
    let errors = 0;
    // Datos generales
    if (!quoteTitle?.trim()) errors++;
    if (!clientName?.trim()) errors++;
    if (!destinationData.ciudad?.trim()) errors++;
    if (!clientData.cantidadPasajeros) errors++;

    // Vuelos (si corresponde)
    if (formMode === 'flight' || formMode === 'flight_hotel' || formMode === 'full') {
      if (!flights || flights.length === 0) {
        errors++;
      } else {
        flights.forEach((flight) => {
          if (!flight.nombre?.trim()) errors++;
          if (!flight.fechaSalida) errors++;
          if (!flight.fechaRetorno) errors++;
          // Fechas válidas
          if (flight.fechaSalida && flight.fechaRetorno && new Date(flight.fechaSalida) > new Date(flight.fechaRetorno)) errors++;
          // Precios obligatorios (al menos uno por tipo de pasajero y check activo)
          if (clientData.cantidadAdultos > 0) {
            const tienePrecioAdulto =
              (flight.precioAdultoMochila && flight.mostrarPrecioAdultoMochila) ||
              (flight.precioAdultoMochilaCarryOn && flight.mostrarPrecioAdultoMochilaCarryOn) ||
              (flight.precioAdultoMochilaCarryOnValija && flight.mostrarPrecioAdultoMochilaCarryOnValija);
            if (!tienePrecioAdulto) errors++;
          }
          if (clientData.cantidadMenores > 0) {
            const tienePrecioMenor =
              (flight.precioMenorMochila && flight.mostrarPrecioMenorMochila) ||
              (flight.precioMenorMochilaCarryOn && flight.mostrarPrecioMenorMochilaCarryOn) ||
              (flight.precioMenorMochilaCarryOnValija && flight.mostrarPrecioMenorMochilaCarryOnValija);
            if (!tienePrecioMenor) errors++;
          }
          if (clientData.cantidadInfantes > 0) {
            if (!(flight.precioInfante && flight.mostrarPrecioInfante)) errors++;
          }
        });
      }
    }

    // Alojamientos (si corresponde)
    if (formMode === 'flight_hotel' || formMode === 'full') {
      if (!accommodations || accommodations.length === 0) {
        errors++;
      } else {
        accommodations.forEach((acc) => {
          if (!acc.nombre?.trim()) errors++;
          if (!acc.ciudad?.trim()) errors++;
          if (!acc.checkin) errors++;
          if (!acc.checkout) errors++;
          // Fechas válidas
          if (acc.checkin && acc.checkout && new Date(acc.checkin) >= new Date(acc.checkout)) errors++;
          // Precio obligatorio
          if (!acc.precioTotal && (!acc.habitaciones || acc.habitaciones.length === 0 || acc.habitaciones.some((h: any) => !h.precio))) errors++;
        });
      }
    }

    // Traslados (solo en full)
    if (formMode === 'full') {
      if (!transfers || transfers.length === 0) {
        // No es obligatorio tener traslados, pero si hay, validar
      } else {
        transfers.forEach((transfer) => {
          if (!transfer.nombre?.trim()) errors++;
          if (!transfer.origen?.trim()) errors++;
          if (!transfer.destino?.trim()) errors++;
          if (!transfer.fecha) errors++;
          if (!transfer.hora) errors++;
          if (!transfer.precio) errors++;
        });
      }
    }

    // Servicios/Actividades (solo en full)
    if (formMode === 'full') {
      if (!services || services.length === 0) {
        // No es obligatorio tener servicios, pero si hay, validar
      } else {
        services.forEach((service) => {
          if (!service.nombre?.trim()) errors++;
          if (!service.descripcion?.trim()) errors++;
          if (!service.fecha) errors++;
          if (!service.precio) errors++;
        });
      }
    }

    return errors;
  };

  const calculateSummaryItems = () => {
    let items = 0;
    if (destinationData.pais || destinationData.ciudad) items++;
    if (flights?.length) items++;
    if (accommodations?.length) items++;
    if (transfers?.length) items++;
    if (services?.length) items++;
    if (summaryData?.total) items++;
    return items;
  };

  // Estado para moneda global
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  // Estado para mostrar cantidad de pasajeros en el PDF
  const [mostrarCantidadPasajeros, setMostrarCantidadPasajeros] = useState(true);

  const handleFeatureToggle = (feature: string, enabled: boolean) => {
    setFeaturesEnabled((prev: any) => {
      const updated = { ...prev, [feature]: enabled };
      if (typeof window !== 'undefined') {
        localStorage.setItem('featuresEnabled', JSON.stringify(updated));
      }
      return updated;
    });
    // Si se deshabilita el sidebar, también lo cerramos
    if (feature === 'sidebar' && !enabled) setShowUnifiedSidebar(false);
  };

  // Usar los hooks personalizados
  const { 
    currentTemplate: template, 
    updateCurrentTemplate: updateTemplate, 
    isSaving: isSavingTemplate,
    templates: userTemplates,
    isLoading: isLoadingTemplates,
    error: templateError,
    validationErrors: templateValidationErrors,
    loadTemplates: loadUserTemplates,
    createTemplate,
    updateTemplate: updateTemplateById,
    deleteTemplate,
    clearErrors: clearTemplateErrors
  } = useTemplates(user)
  const { saveQuote, updateQuote } = useQuotes(user)

  // Estado para destino y año
  const [destinationData, setDestinationData] = useState({
    pais: "",
    ciudad: "",
    año: new Date().getFullYear().toString(),
    meses: [] as string[],
  })

  // Estado para el formulario
  const [clientData, setClientData] = useState({
    cantidadPasajeros: 0,
    cantidadAdultos: 0,
    cantidadMenores: 0,
    cantidadInfantes: 0,
  })

  const [flights, setFlights] = useState<any[]>([]); // cada vuelo tendrá currency y useCustomCurrency
  const [accommodations, setAccommodations] = useState<any[]>([]); // cada hotel tendrá currency y useCustomCurrency
  const [transfers, setTransfers] = useState<any[]>([]); // cada traslado tendrá currency y useCustomCurrency
  const [services, setServices] = useState<any[]>([]); // cada servicio tendrá currency y useCustomCurrency
  const [summaryData, setSummaryData] = useState({
    subtotalVuelos: 0,
    subtotalHoteles: 0,
    subtotalTraslados: 0,
    subtotalServicios: 0,
    subtotal: 0,
    total: 0,
    observaciones: "",
    mostrarTotal: true,
  })

  // Definir los pasos del wizard (sin 'Mis Cotizaciones')
  const wizardSteps = [
    "Personalizar",
    "Datos Generales",
    "Servicios",
    "Resumen",
    "Resultado"
  ];

  // Sub-pasos para el tab 'Crear Cotización'
  const formSubSteps = [
    "Datos Generales",
    "Servicios",
    "Resumen"
  ];
  const [formStep, setFormStep] = useState(0);

  // Determinar el paso actual del wizard según el tab
  let wizardStepIndex = 0;
  if (activeTab === "form") wizardStepIndex = formStep + 1; // +1 porque el paso 0 es Personalizar
  else if (activeTab === "result") wizardStepIndex = 4;

  // Función para detectar cambios en los datos
  const markAsChanged = () => {
    setHasUnsavedChanges(true)
    
    // Limpiar timeout anterior
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }
    
    // Auto-guardar después de 3 segundos de inactividad
    const timeout = setTimeout(() => {
      if (hasUnsavedChanges && user) {
        saveCurrentQuote(true) // true = auto-save
      }
    }, 3000)
    
    setAutoSaveTimeout(timeout)
  }

  // Verificar autenticación al cargar
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setUser(session?.user ?? null)
      setIsCheckingAuth(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null)
      setIsCheckingAuth(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      searchParams &&
      user &&
      !hasHandledTabParam
    ) {
      const tabParam = searchParams.get('tab');
      if (tabParam === 'history') {
        setActiveTab('history');
        setHasHandledTabParam(true);
        // No limpiar el query param aquí
      } else if (tabParam === 'form') {
        setActiveTab('form');
        setHasHandledTabParam(true);
      } else if (tabParam === 'templates') {
        setActiveTab('templates');
        setHasHandledTabParam(true);
      } else if (tabParam === null) {
        setActiveTab('form');
        setHasHandledTabParam(true);
      }
    }
  }, [user, searchParams, hasHandledTabParam]);

  useEffect(() => {
    const handler = () => {
      clearForm();
      setActiveTab('form');
      // Actualizar URL para mantener el estado en refresh
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', 'form');
        window.history.replaceState({}, '', url.toString());
      }
    };
    window.addEventListener('goToCreateQuoteTab', handler);
    return () => window.removeEventListener('goToCreateQuoteTab', handler);
  }, []);

  useEffect(() => {
    const handler = () => {
      setActiveTab('history');
      // Actualizar URL para mantener el estado en refresh
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', 'history');
        window.history.replaceState({}, '', url.toString());
      }
    };
    window.addEventListener('goToHistoryTab', handler);
    return () => window.removeEventListener('goToHistoryTab', handler);
  }, []);

  // Lógica para escuchar el evento de ir a templates desde el User Menu
  useEffect(() => {
    const handler = () => {
      setActiveTab('templates');
      // Actualizar URL para mantener el estado en refresh
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', 'templates');
        window.history.replaceState({}, '', url.toString());
      }
    };
    window.addEventListener('goToTemplatesTab', handler);
    return () => window.removeEventListener('goToTemplatesTab', handler);
  }, []);


  // Estado y lógica para templates


  // Usar fetchTemplates del hook
  const fetchTemplates = async () => {
    try {
      await loadUserTemplates();
    } catch (err: any) {
      console.error('Error inesperado al obtener templates:', err, JSON.stringify(err));
      toast({
        title: "Error al cargar templates",
        description: err.message || 'Error al cargar templates',
        variant: "destructive"
      });
    }
  };

  // useEffect para cargar templates cuando se entra al tab
  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
    }
  }, [activeTab]);

  // Actualizar subtotales cuando cambian los datos
  useEffect(() => {
    // Solo sumar alojamiento, traslados y servicios
    const accommodationTotal = accommodations.reduce((sum, acc) => sum + (acc.precioTotal || 0), 0)
    const transferTotal = transfers.reduce((sum, transfer) => sum + (Number.parseFloat(transfer.precio) || 0), 0)
    const serviceTotal = services.reduce((sum, service) => sum + (Number.parseFloat(service.precio) || 0), 0)

    const subtotal = accommodationTotal + transferTotal + serviceTotal
    const total = subtotal // Sin descuentos ni impuestos

    setSummaryData((prev) => ({
      ...prev,
      subtotalVuelos: 0, // No sumar vuelos
      subtotalHoteles: accommodationTotal,
      subtotalTraslados: transferTotal,
      subtotalServicios: serviceTotal,
      subtotal,
      total,
    }))
  }, [flights, accommodations, transfers, services])

  useEffect(() => {
    markAsChanged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flights, accommodations, transfers, services, destinationData, clientData, selectedCurrency, mostrarCantidadPasajeros]);

  const handleAuthChange = () => {
    // La autenticación se maneja automáticamente por el listener
  }

  const handleLogout = () => {
    clearForm()
    setActiveTab("customize")
  }

  const clearForm = () => {
    setDestinationData({ pais: "", ciudad: "", año: new Date().getFullYear().toString(), meses: [] })
    setClientData({ cantidadPasajeros: 0, cantidadAdultos: 0, cantidadMenores: 0, cantidadInfantes: 0 })
    setFlights([])
    setAccommodations([])
    setTransfers([])
    setServices([])
    setPdfUrl(null)
    setCurrentQuoteId(null)
    setQuoteTitle("")
    setClientName("")
    setSelectedCurrency("USD")
    setMostrarCantidadPasajeros(true);
    setHasUnsavedChanges(false)
    setLastSaved(null)
  }

  const loadQuote = (quote: Quote) => {
    // Detectar tipo de cotización
    let detectedFormMode: 'flight' | 'flight_hotel' | 'full' = 'full';
    const hasFlights = quote.flights_data && quote.flights_data.length > 0;
    const hasAccommodations = quote.accommodations_data && quote.accommodations_data.length > 0;
    const hasTransfers = quote.transfers_data && quote.transfers_data.length > 0;
    const hasServices = quote.services_data && quote.services_data.length > 0;

    if (hasFlights && !hasAccommodations && !hasTransfers && !hasServices) {
      detectedFormMode = 'flight';
    } else if (hasFlights && hasAccommodations && !hasTransfers && !hasServices) {
      detectedFormMode = 'flight_hotel';
    } else if (hasFlights && (hasAccommodations || hasTransfers || hasServices)) {
      detectedFormMode = 'full';
    } else {
      detectedFormMode = 'full'; // O ajusta según tu lógica
    }
    setFormMode(detectedFormMode);

    // Cargar datos de la cotización
    setDestinationData({
      pais: quote.destination?.split(", ")[0] || "",
      ciudad: quote.destination?.split(", ")[1] || "",
      año: quote.year || new Date().getFullYear().toString(),
      meses: quote.client_data?.meses || [],
    })

    if (quote.client_data) {
      setClientData(quote.client_data)
    }

    if (quote.flights_data) {
      setFlights(quote.flights_data)
    }

    if (quote.accommodations_data) {
      setAccommodations(quote.accommodations_data)
    }

    if (quote.transfers_data) {
      setTransfers(quote.transfers_data)
    }

    if (quote.services_data) {
      setServices(quote.services_data)
    }

    if (quote.summary_data) {
      setSummaryData(quote.summary_data)
      if (quote.summary_data.currency) {
        setSelectedCurrency(quote.summary_data.currency)
      }
      setMostrarCantidadPasajeros(quote.summary_data?.mostrarCantidadPasajeros ?? true);
    }

    setCurrentQuoteId(quote.id)
    setQuoteTitle(quote.title)
    setClientName(quote.client_name || "")
    setPdfUrl(quote.pdf_url || null)
    setHasUnsavedChanges(false)
    setLastSaved(new Date(quote.updated_at))

    // Cambiar a la pestaña de formulario
    setActiveTab("form")
    setFormStep(0)

    // Actualizar URL para mantener el tab en 'form' tras refresh
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'form');
      window.history.replaceState({}, '', url.toString());
    }
  }

  const saveCurrentQuote = async (isAutoSave = false) => {
    if (!user) return

    try {
      // Validar fechas antes de guardar
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
        if (!isAutoSave) {
          setError("Hay fechas inválidas en alojamientos o vuelos. Por favor, corrige las fechas antes de guardar.");
        }
        return;
      }

      setIsSaving(true)
      const quoteData = {
        title: quoteTitle || `Cotización ${destinationData.pais} ${destinationData.ciudad || "Sin título"}`,
        destination: `${destinationData.pais}${destinationData.ciudad ? `, ${destinationData.ciudad}` : ""}`,
        year: destinationData.año,
        client_data: { ...clientData, meses: destinationData.meses },
        flights_data: flights,
        accommodations_data: accommodations,
        transfers_data: transfers,
        services_data: services,
        summary_data: { ...summaryData, currency: selectedCurrency, mostrarCantidadPasajeros },
        template_data: template,
        total_amount: summaryData.total,
        client_name: clientName,
        status: "draft",
      }

      if (currentQuoteId) {
        await updateQuote(currentQuoteId, quoteData)
      } else {
        const newQuote = await saveQuote(quoteData)
        setCurrentQuoteId(newQuote.id)
      }

      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      
      if (!isAutoSave) {
        setError(null)
        // Mostrar mensaje de éxito brevemente
        const successMsg = "Cotización guardada correctamente"
        setError(successMsg)
        setTimeout(() => setError(null), 3000)
      }
    } catch (err: any) {
      if (!isAutoSave) {
        setError(err.message)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const prepareQuoteData = () => {
    // Validar fechas antes de preparar los datos
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
      throw new Error("Hay fechas inválidas en alojamientos o vuelos. Por favor, corrige las fechas antes de generar el PDF.");
    }

    // Obtener todos los requisitos migratorios de todos los vuelos
    const todosRequisitos = flights.reduce((acc, flight) => {
      if (flight.requisitosMigratorios && flight.requisitosMigratorios.length > 0) {
        return [...acc, ...flight.requisitosMigratorios]
      }
      return acc
    }, [])

    // Eliminar duplicados
    const requisitosMigratoriosUnicos = Array.from(new Set(todosRequisitos))

    return {
      destino: {
        pais: destinationData.pais,
        ciudad: destinationData.ciudad,
        año: destinationData.año,
        meses: destinationData.meses,
      },
      requisitosMigratorios: requisitosMigratoriosUnicos,
      cliente: {
        cantidad_pasajeros: clientData.cantidadPasajeros,
        cantidad_adultos: clientData.cantidadAdultos,
        cantidad_menores: clientData.cantidadMenores,
        cantidad_infantes: clientData.cantidadInfantes,
      },
      vuelos: flights.map((flight) => {
        const opciones = []

        // Agregar opciones de adultos
        if (clientData.cantidadAdultos > 0) {
          if (flight.precioAdultoMochila && flight.mostrarPrecioAdultoMochila) {
            opciones.push({
              tipo: "mochila",
              precio: Number.parseFloat(flight.precioAdultoMochila) || 0,
              pasajero: "adulto",
            })
          }
          if (flight.precioAdultoMochilaCarryOn && flight.mostrarPrecioAdultoMochilaCarryOn) {
            opciones.push({
              tipo: "mochilaCarryOn",
              precio: Number.parseFloat(flight.precioAdultoMochilaCarryOn) || 0,
              pasajero: "adulto",
            })
          }
          if (flight.precioAdultoMochilaCarryOnValija && flight.mostrarPrecioAdultoMochilaCarryOnValija) {
            opciones.push({
              tipo: "mochilaCarryOnValija",
              precio: Number.parseFloat(flight.precioAdultoMochilaCarryOnValija) || 0,
              pasajero: "adulto",
            })
          }
        }

        // Agregar opciones de menores
        if (clientData.cantidadMenores > 0) {
          if (flight.precioMenorMochila && flight.mostrarPrecioMenorMochila) {
            opciones.push({
              tipo: "mochila",
              precio: Number.parseFloat(flight.precioMenorMochila) || 0,
              pasajero: "menor",
            })
          }
          if (flight.precioMenorMochilaCarryOn && flight.mostrarPrecioMenorMochilaCarryOn) {
            opciones.push({
              tipo: "mochilaCarryOn",
              precio: Number.parseFloat(flight.precioMenorMochilaCarryOn) || 0,
              pasajero: "menor",
            })
          }
          if (flight.precioMenorMochilaCarryOnValija && flight.mostrarPrecioMenorMochilaCarryOnValija) {
            opciones.push({
              tipo: "mochilaCarryOnValija",
              precio: Number.parseFloat(flight.precioMenorMochilaCarryOnValija) || 0,
              pasajero: "menor",
            })
          }
        }

        // Agregar opción de infantes
        if (clientData.cantidadInfantes > 0 && flight.precioInfante && flight.mostrarPrecioInfante) {
          opciones.push({
            tipo: "infante",
            precio: Number.parseFloat(flight.precioInfante) || 0,
            pasajero: "infante",
          })
        }

        return {
          nombre: flight.nombre,
          fechaSalida: flight.fechaSalida,
          fechaRetorno: flight.fechaRetorno,
          tipoTarifa: flight.tipoTarifa,
          imagenes: flight.imagenes || [],
          opciones: opciones,
          condicionesTarifa: flight.condicionesTarifa,
          textoLibre: flight.textoLibre,
          useCustomCurrency: flight.useCustomCurrency,
          currency: flight.currency,
        }
      }),
      hoteles: accommodations.map((acc) => {
        // Usar siempre el valor del formulario si existe
        let cantidadNoches = acc.cantidadNoches;
        if (cantidadNoches === undefined && acc.checkin && acc.checkout) {
          const checkinDate = new Date(acc.checkin);
          const checkoutDate = new Date(acc.checkout);
          const diffTime = checkoutDate.getTime() - checkinDate.getTime();
          cantidadNoches = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
        }
        return {
          nombre: acc.nombre,
          ciudad: acc.ciudad,
          checkin: acc.checkin,
          checkout: acc.checkout,
          cantidadHabitaciones: acc.cantidadHabitaciones,
          habitaciones: acc.habitaciones || [],
          precioTotal: acc.precioTotal || 0,
          mostrarPrecio: acc.mostrarPrecio,
          imagenes: acc.imagenes || [],
          textoLibre: acc.textoLibre,
          useCustomCurrency: acc.useCustomCurrency,
          currency: acc.currency,
          cantidadNoches: cantidadNoches,
        }
      }),
      traslados: transfers.map((transfer) => ({
        nombre: transfer.nombre,
        origen: transfer.origen,
        destino: transfer.destino,
        tipoTraslado: transfer.tipoTraslado,
        fecha: transfer.fecha,
        hora: transfer.hora,
        precio: Number.parseFloat(transfer.precio) || 0,
        mostrarPrecio: transfer.mostrarPrecio,
        imagenes: transfer.imagenes || [],
        textoLibre: transfer.textoLibre,
        useCustomCurrency: transfer.useCustomCurrency,
        currency: transfer.currency,
      })),
      actividades: services.map((service) => ({
        nombre: service.nombre,
        descripcion: service.descripcion,
        fecha: service.fecha,
        duracion: service.duracion,
        precio: Number.parseFloat(service.precio) || 0,
        mostrarPrecio: service.mostrarPrecio,
        imagenes: service.imagenes || [],
        useCustomCurrency: service.useCustomCurrency,
        currency: service.currency,
      })),
      totales: {
        subtotal_vuelos: summaryData.subtotalVuelos,
        subtotal_hoteles: summaryData.subtotalHoteles,
        subtotal_traslados: summaryData.subtotalTraslados,
        subtotal_actividades: summaryData.subtotalServicios,
        subtotal: summaryData.subtotal,
        total: summaryData.total,
        mostrar_total: summaryData.mostrarTotal,
        currency: selectedCurrency,
      },
      observaciones: summaryData.observaciones,
      mostrarCantidadPasajeros,
      // Desglose de totales por moneda (corrigiendo para sumar solo si hay precio y moneda definida)
      totalesPorMoneda: (() => {
        const totales: Record<string, number> = {};
        // Hoteles
        accommodations.forEach(acc => {
          const moneda = acc.useCustomCurrency && acc.currency ? acc.currency : selectedCurrency;
          if (acc.precioTotal && moneda) {
            totales[moneda] = (totales[moneda] || 0) + Number(acc.precioTotal);
          }
        });
        // Traslados
        transfers.forEach(transfer => {
          const moneda = transfer.useCustomCurrency && transfer.currency ? transfer.currency : selectedCurrency;
          if (transfer.precio && moneda) {
            totales[moneda] = (totales[moneda] || 0) + Number(transfer.precio);
          }
        });
        // Servicios
        services.forEach(service => {
          const moneda = service.useCustomCurrency && service.currency ? service.currency : selectedCurrency;
          if (service.precio && moneda) {
            totales[moneda] = (totales[moneda] || 0) + Number(service.precio);
          }
        });
        return totales;
      })(),
    }
  }

  const generatePdf = async () => {
    setIsProcessing(true)
    setError(null)
    setProcessingStatus({ step: "Preparando datos...", progress: 20 })

    try {
      // Guardar cotización antes de generar PDF
      await saveCurrentQuote()

      const quoteData = prepareQuoteData()

      setProcessingStatus({ step: "Generando vista previa...", progress: 60 })

      // Generar HTML para vista previa
      const pdfResponse = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: quoteData,
          template: template,
        }),
      })

      if (!pdfResponse.ok) {
        throw new Error("Error al generar la vista previa")
      }

      const htmlBlob = await pdfResponse.blob()
      const htmlUrl = URL.createObjectURL(htmlBlob)
      setPdfUrl(htmlUrl)

      setProcessingStatus({ step: "Completado", progress: 100 })

      // Actualizar estado de la cotización
      if (currentQuoteId) {
        await updateQuote(currentQuoteId, {
          status: "completed",
          pdf_url: htmlUrl,
        })
      }

      setTimeout(() => {
        setActiveTab("result")
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsProcessing(false)
      setTimeout(() => setProcessingStatus(null), 2000)
    }
  }

  const viewPreview = async () => {
    if (pdfUrl) {
      const response = await fetch(pdfUrl, { mode: 'cors' });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    }
  }

  const isSupabasePdfUrl = (url: string | null) => {
    if (!url) return false;
    return url.includes('/storage/v1/object/public/quotes-pdfs/');
  };

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      // --- Generar nombre de archivo personalizado ---
      const ciudad = destinationData.ciudad?.trim() || 'Destino';
      const año = destinationData.año || new Date().getFullYear().toString();
      const hoy = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const fechaStr = `${pad(hoy.getDate())}-${pad(hoy.getMonth() + 1)}-${hoy.getFullYear()}`;
      const nombreArchivo = `${ciudad}_${año}_${fechaStr}`.replace(/\s+/g, '_');
      // --- Fin nombre personalizado ---
      if (isSupabasePdfUrl(pdfUrl)) {
        // Descargar el PDF como blob para forzar el nombre y evitar abrir en la misma pestaña
        const response = await fetch(pdfUrl!, { mode: 'cors' });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${nombreArchivo}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return;
      }
      // Obtener HTML seguro del iframe
      const iframe = document.getElementById('pdf-preview-iframe') as HTMLIFrameElement | null;
      const html =
        iframe && iframe.contentDocument && iframe.contentDocument.documentElement
          ? iframe.contentDocument.documentElement.outerHTML
          : null;
      if (!html) {
        alert('No se pudo obtener el HTML de la vista previa.');
        setIsDownloadingPdf(false);
        return;
      }
      const response = await fetch('/api/save-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: currentQuoteId,
          html,
        }),
      });
      const data = await response.json();
      if (data.success && data.pdfUrl) {
        setPdfUrl(data.pdfUrl);
        // Descargar el PDF generado como blob
        const response = await fetch(data.pdfUrl, { mode: 'cors' });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${nombreArchivo}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Error al generar el PDF.');
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const { toast } = useToast();
  // Estado para modal de template
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [templateForm, setTemplateForm] = useState<any>(null);
  const [isSavingTemplateModal, setIsSavingTemplateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);

  // Estado para modal de selección de template
  const [showTemplateSelectModal, setShowTemplateSelectModal] = useState(false);

  // Función para abrir modal de nuevo template
  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      primaryColor: "#2563eb",
      secondaryColor: "#f3f4f6",
      fontFamily: "inherit",
      logo: null,
      agencyName: "",
      agencyAddress: "",
      agencyPhone: "",
      agencyEmail: "",
      validityText: "Esta cotización es válida por 15 días desde la fecha de emisión.",
    });
    setShowTemplateModal(true);
  };

  // Función para abrir modal de editar template
  const handleEditTemplate = (tpl: Template) => {
    setEditingTemplate(tpl);
    setTemplateForm({ ...tpl.template_data });
    setShowTemplateModal(true);
  };

  // Guardar template (crear o editar)
  const handleSaveTemplate = async () => {
    console.log('Intentando guardar template:', templateForm);
    setIsSavingTemplateModal(true);
    clearTemplateErrors(); // Limpiar errores previos
    
    try {
      if (editingTemplate) {
        // Editar
        await updateTemplateById(editingTemplate.id, {
          name: templateForm.name || editingTemplate.name,
          template_data: templateForm,
        });
        toast({ title: "Template actualizado" });
      } else {
        // Crear
        await createTemplate(templateForm.name || "Sin nombre", templateForm);
        toast({ title: "Template creado" });
      }
      // Refrescar lista y limpiar estado
      await fetchTemplates();
      setShowTemplateModal(false);
      setEditingTemplate(null);
      setTemplateForm(null);
    } catch (err: any) {
      console.error('Error al guardar template:', err);
      
      // Mostrar errores de validación específicos
      if (templateValidationErrors.length > 0) {
        const validationMessage = templateValidationErrors.map(e => e.message).join(', ');
        toast({ 
          title: "Errores de validación", 
          description: validationMessage, 
          variant: "destructive" 
        });
      } else if (templateError) {
        // Mostrar error específico del template
        toast({ 
          title: "Error al guardar template", 
          description: templateError.message, 
          variant: "destructive" 
        });
      } else {
        // Error genérico
        toast({ 
          title: "Error inesperado", 
          description: err.message || 'Error al guardar template', 
          variant: "destructive" 
        });
      }
    } finally {
      setIsSavingTemplateModal(false);
    }
  };

  // Eliminar template
  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    try {
      await deleteTemplate(templateToDelete.id);
      toast({ title: "Template eliminado" });
      setShowDeleteConfirm(false);
      setTemplateToDelete(null);
      await fetchTemplates();
    } catch (err: any) {
      console.error('Error al eliminar template:', err);
      
      if (templateError) {
        toast({ 
          title: "Error al eliminar template", 
          description: templateError.message, 
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Error", 
          description: err.message || 'Error al eliminar template', 
          variant: "destructive" 
        });
      }
    }
  };

  // Handler para FloatingNewQuoteButton y menú
  const handleCreateQuote = () => {
    clearForm();
    if (userTemplates.length > 0) {
      setShowTemplateSelectModal(true);
    } else {
      setShowTemplateSelectModal(true); // Usamos el mismo modal para mostrar el mensaje sin templates
    }
  };

  // Handler para seleccionar template guardado
  const handleSelectTemplate = (tpl: Template) => {
    updateTemplate(tpl.template_data);
    setShowTemplateSelectModal(false);
    setActiveTab('customize');
  };

  // Handler para template temporal
  const handleUseTempTemplate = () => {
    updateTemplate({}); // Limpiar para template temporal
    setShowTemplateSelectModal(false);
    setActiveTab('customize');
  };

  // Handler para ir a Mis Templates
  const handleGoToTemplates = () => {
    setShowTemplateSelectModal(false);
    setActiveTab('templates');
  };

  const [formMode, setFormMode] = useState<'flight' | 'flight_hotel' | 'full'>('full');

  // Handler para FloatingNewQuoteButton
  const handleNewQuoteMode = async (mode: 'flight' | 'flight_hotel' | 'full') => {
    setFormMode(mode);
    clearForm();
    setShowTemplateSelectModal(true);
    await fetchTemplates();
  };

  // 1. Agregar un estado para mostrar la vista previa
  const [showPreview, setShowPreview] = useState(false);

  // Estado para saber si el PDF existe
  const [pdfExists, setPdfExists] = useState(true);

  // Efecto para verificar si el PDF existe cuando cambia pdfUrl
  useEffect(() => {
    if (!pdfUrl) {
      setPdfExists(false);
      return;
    }
    let cancelled = false;
    fetch(pdfUrl, { method: 'HEAD' })
      .then(res => {
        if (!cancelled) setPdfExists(res.ok);
      })
      .catch(() => {
        if (!cancelled) setPdfExists(false);
      });
    return () => { cancelled = true; };
  }, [pdfUrl]);

  // --- LOS RETURNS CONDICIONALES VAN DESPUÉS DE LOS HOOKS ---
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm setView={(view) => {
      if (view === 'check-email') {
        // Manejar el cambio de vista si es necesario
      }
    }} />
  }

  const pathname = usePathname();

  // Determinar saludo según la hora
  const getSaludo = () => {
    const hora = new Date().getHours();
    if (hora >= 6 && hora < 12) return "Buenos días";
    if (hora >= 12 && hora < 19) return "Buenas tardes";
    return "Buenas noches";
  };

  const nombreUsuario = user?.user_metadata?.full_name?.trim() ? user.user_metadata.full_name : (user?.email?.split("@")?.[0] || "Usuario");

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <div className="min-h-screen p-4">
              {user && (
          <UserMenu 
            user={user} 
            onLogout={handleLogout} 
            onToggleSidebar={(enabled) => handleFeatureToggle('sidebar', enabled)} 
            sidebarEnabled={featuresEnabled.sidebar}
          />
        )}

      {/* {showPdfGenerator && (
        <PdfGenerator data={prepareQuoteData()} template={template} />
      )} */}

      <div className="max-w-7xl mx-auto">
        {/* Bloque de bienvenida siempre visible */}
        <div className="mb-6 lg:mb-8 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-100 to-blue-100 shadow-xl px-4 py-6 md:px-8 lg:px-12 md:py-8 lg:py-12 flex flex-col items-center relative overflow-hidden">
          <div className="flex justify-center mb-3 lg:mb-4 z-10">
            <img src="/images/logo-negro.svg" alt="Iterio Logo" className="h-20 w-auto lg:h-28" />
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-1 z-10 drop-shadow-sm text-center">¡Crea tu cotización en minutos!</h1>
          <p className="text-sm md:text-base lg:text-lg font-normal text-gray-500 mt-1 z-10 text-center">
            {getSaludo()}, <span className="text-blue-600 font-semibold">{nombreUsuario}</span>
          </p>
          {isSavingTemplate && <p className="text-xs text-blue-600 mt-3 z-10">💾 Guardando configuración...</p>}
        </div>
        {/* Fin bloque de bienvenida */}

        {/* Botón flotante siempre visible excepto en 'form' y 'admin' */}
        {!pathname.startsWith('/admin') && activeTab !== 'form' && (
          <FloatingNewQuoteButton
            onSelect={handleNewQuoteMode}
          />
        )}

        {showTemplateSelectModal && (
          <Dialog open={showTemplateSelectModal} onOpenChange={setShowTemplateSelectModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Selecciona un template para tu cotización</DialogTitle>
                <DialogDescription>
                  Elige un template para personalizar tu cotización. También puedes crear uno temporal si lo deseas.
                </DialogDescription>
              </DialogHeader>
              {userTemplates.length > 0 ? (
                <>
                  <div className="space-y-4 max-h-72 overflow-y-auto">
                    {userTemplates.map((tpl: Template) => (
                      <div key={tpl.id} className="flex items-center gap-4 border border-gray-200 rounded-xl p-3 bg-white hover:shadow-md transition cursor-pointer" onClick={() => handleSelectTemplate(tpl)}>
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center border border-gray-200 bg-white shadow-sm" style={{ fontFamily: tpl.template_data.fontFamily || "inherit" }}>
                          {tpl.template_data.logo ? (
                            <img src={tpl.template_data.logo} alt="Logo" className="max-h-10 max-w-10 object-contain" />
                          ) : (
                            <span className="text-xl font-bold text-gray-300">?</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-base text-gray-900 truncate">{tpl.name}</div>
                          {tpl.template_data.agencyName && (
                            <div className="text-xs text-gray-500 truncate">{tpl.template_data.agencyName}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex flex-col gap-2">
                    <Button variant="outline" onClick={handleUseTempTemplate}>Usar template temporal</Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-6">
                  <p className="text-gray-600 text-center mb-4">No tienes templates guardados. Te recomendamos crear uno para personalizar tus cotizaciones.</p>
                  <Button onClick={handleGoToTemplates}>Ir a Mis Templates</Button>
                </div>
              )}
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Stepper y Tabs: solo para customize, form y result */}
        {activeTab !== 'history' && activeTab !== 'templates' && (
          <>
            <Stepper
              steps={wizardSteps}
              currentStep={
                activeTab === "form"
                  ? formStep + 1 // +1 porque el paso 0 es Personalizar
                  : wizardStepIndex
              }
              onStepClick={(idx) => {
                if (idx === 0) setActiveTab('customize');
                else if (idx >= 1 && idx <= 3) { setActiveTab('form'); setFormStep(idx - 1); }
                else if (idx === 4) setActiveTab('result');
              }}
            />
            <Tabs value={activeTab} onValueChange={(tab: string) => {
              setActiveTab(tab);
              if (tab === "form") setFormStep(0);
            }} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="customize">Personalizar</TabsTrigger>
                <TabsTrigger value="form" className="relative">
                  Crear Cotización
                  {hasUnsavedChanges && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                  )}
                  {isSaving && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-spin"></div>
                  )}
                </TabsTrigger>
                <TabsTrigger value="result">Resultado</TabsTrigger>
              </TabsList>
              <TabsContent value="customize">
                <TemplateCustomizer template={template} onTemplateChange={updateTemplate} />
              </TabsContent>
              <TabsContent value="form" className="space-y-6">
                <SaveStatusIndicator 
                  isSaving={isSaving}
                  lastSaved={lastSaved}
                  hasUnsavedChanges={hasUnsavedChanges}
                />
                
                <div className={`grid gap-4 lg:gap-8 relative px-2 pb-4 lg:pr-0 ${featuresEnabled.sidebar && showUnifiedSidebar ? 'grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_370px]' : 'grid-cols-1'}` }>
                  <div className="min-w-0">
                    {/* Botón contextual para mostrar el sidebar o asistencia, reemplazando al botón ovalado */}
                    {featuresEnabled.sidebar && !showUnifiedSidebar && (
                      <div className="w-full flex justify-end mb-4">
                        <button
                          onClick={() => setShowUnifiedSidebar(true)}
                          className={`flex flex-row items-center gap-2 px-4 py-2 rounded-full font-medium text-sm shadow transition
                            ${calculateHelpErrors() > 0
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'}
                          `}
                          type="button"
                        >
                          {calculateHelpErrors() > 0 ? (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          ) : (
                            // Icono de ojo abierto
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M1.5 12s4-7 10.5-7 10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" /><circle cx="12" cy="12" r="3" /></svg>
                          )}
                          {calculateHelpErrors() > 0
                            ? `Hay ${calculateHelpErrors()} error${calculateHelpErrors() === 1 ? '' : 'es'}, pulse para asistencia.`
                            : 'Mostrar panel de asistencia'}
                        </button>
                      </div>
                    )}
                    {formStep === 0 && (
                      <>
                        <Card>
                          <CardHeader>
                            <CardTitle>Información de la Cotización</CardTitle>
                            <CardDescription>
                              Tu cotización se guarda automáticamente cada 3 segundos después de hacer cambios
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex flex-col md:flex-row gap-4">
                              <div className="flex-1">
                                <Label htmlFor="quote-title">Título de la cotización</Label>
                                <Input
                                  id="quote-title"
                                  value={quoteTitle}
                                  onChange={(e) => {
                                    setQuoteTitle(e.target.value)
                                    markAsChanged()
                                  }}
                                  placeholder="Ej: Viaje a París - Familia García"
                                />
                              </div>
                              <div className="flex-1">
                                <Label htmlFor="client-name">Nombre del Cliente</Label>
                                <Input
                                  id="client-name"
                                  value={clientName}
                                  onChange={(e) => {
                                    setClientName(e.target.value)
                                    markAsChanged()
                                  }}
                                  placeholder="Ej: Juan Pérez"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader>
                            <CardTitle>Moneda de Cotización</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <Label htmlFor="currency">Seleccionar moneda</Label>
                              <select
                                id="currency"
                                value={selectedCurrency}
                                onChange={(e) => setSelectedCurrency(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="USD">USD - Dólar Estadounidense</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="ARS">ARS - Peso Argentino</option>
                              </select>
                            </div>
                          </CardContent>
                        </Card>
                        <DestinationSection destinationData={destinationData} onChange={setDestinationData} />
                        <ClientSection
                          clientData={clientData}
                          onChange={setClientData}
                          mostrarCantidadPasajeros={mostrarCantidadPasajeros}
                          setMostrarCantidadPasajeros={setMostrarCantidadPasajeros}
                        />
                      </>
                    )}
                    {formStep === 1 && (
                      <>
                        {/* Render según formMode */}
                        {formMode === 'flight' && (
                          <FlightsSection flights={flights} onChange={setFlights} clientData={clientData} selectedCurrency={selectedCurrency} />
                        )}
                        {formMode === 'flight_hotel' && (
                          <>
                            <FlightsSection flights={flights} onChange={setFlights} clientData={clientData} selectedCurrency={selectedCurrency} />
                            <AccommodationSection accommodations={accommodations} onChange={setAccommodations} selectedCurrency={selectedCurrency} />
                          </>
                        )}
                        {formMode === 'full' && (
                          <>
                            <FlightsSection flights={flights} onChange={setFlights} clientData={clientData} selectedCurrency={selectedCurrency} />
                            <AccommodationSection accommodations={accommodations} onChange={setAccommodations} selectedCurrency={selectedCurrency} />
                            <TransfersSection transfers={transfers} onChange={setTransfers} selectedCurrency={selectedCurrency} />
                            <ServicesSection services={services} onChange={setServices} selectedCurrency={selectedCurrency} />
                          </>
                        )}
                      </>
                    )}
                    {formStep === 2 && (
                      <SummarySection
                        summaryData={summaryData}
                        flights={flights}
                        accommodations={accommodations}
                        transfers={transfers}
                        services={services}
                        selectedCurrency={selectedCurrency}
                        onGeneratePdf={generatePdf}
                        isGenerating={isProcessing}
                        destinationData={destinationData}
                        isSidebarVisible={featuresEnabled.sidebar && showUnifiedSidebar}
                        formMode={formMode}
                        onSummaryDataChange={(data) => {
                          setSummaryData(prev => ({ ...prev, ...data }));
                          markAsChanged();
                        }}
                      />
                    )}
                    {/* Navegación de subpasos */}
                    <div className="flex flex-col sm:flex-row justify-between mt-6 gap-3 sm:gap-4">
                      <Button
                        variant="outline"
                        disabled={formStep === 0}
                        onClick={() => setFormStep((s) => Math.max(0, s - 1))}
                        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg border border-blue-200 bg-white/70 text-blue-600 shadow-sm hover:bg-blue-50/80 hover:border-blue-300 transition-all duration-150 font-medium text-sm"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                        <span className="hidden sm:inline">Anterior</span>
                        <span className="sm:hidden">Atrás</span>
                      </Button>
                      <Button
                        onClick={() => setFormStep((s) => Math.min(formSubSteps.length - 1, s + 1))}
                        disabled={formStep === formSubSteps.length - 1}
                        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-blue-400/70 to-blue-600/70 text-white shadow-sm hover:from-blue-500/80 hover:to-blue-700/80 transition-all duration-150 font-medium text-sm"
                      >
                        <span className="hidden sm:inline">Siguiente</span>
                        <span className="sm:hidden">Siguiente</span>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </Button>
                    </div>
                  </div>
                  {/* Sidebar unificado: solo si está habilitado y visible */}
                  {featuresEnabled.sidebar && showUnifiedSidebar && (
                    <div className="hidden lg:block h-full">
                      <div className="sticky top-8">
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
                            mostrarCantidadPasajeros,
                          }}
                          helpErrors={calculateHelpErrors()}
                          summaryItems={calculateSummaryItems()}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="result" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Resultado
                    </CardTitle>
                    <CardDescription>Tu cotización está lista para visualizar y descargar</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {pdfUrl ? (
                      <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-green-800 font-medium">✅ Cotización generada exitosamente</p>
                          <p className="text-green-600 text-sm mt-1">
                            Vista previa disponible abajo. Usa el botón de descarga para guardar la cotización en PDF.
                          </p>
                        </div>
                        <div className="flex gap-4">
                          <Button
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            style={{ backgroundColor: '#2563eb' }}
                            onClick={handleDownloadPdf}
                            disabled={isDownloadingPdf}
                          >
                            {isDownloadingPdf ? (
                              <span className="flex items-center"><svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Generando PDF...</span>
                            ) : (
                              <><Download className="h-4 w-4 mr-2" />Descargar cotización en PDF</>
                            )}
                          </Button>
                          <Button variant="outline" onClick={viewPreview} className="flex-1">
                            <Eye className="h-4 w-4 mr-2" />
                            Abrir cotización en Nueva Pestaña
                          </Button>
                        </div>
                        {pdfUrl && (
                          <div className="border rounded-lg overflow-hidden mt-2">
                            <iframe
                              id="pdf-preview-iframe"
                              src={pdfUrl}
                              className="w-full h-[600px]"
                              title="Vista previa del PDF"
                              style={{ border: "none" }}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Primero completa el formulario y genera una cotización para ver el resultado</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* QuotesHistory y TemplatesManager fuera de Tabs */}
        {activeTab === 'history' && (
          <div className="max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[60vh] w-full">
            <div className="w-full max-w-5xl">
              <QuotesHistory
                user={user}
                onLoadQuote={loadQuote}
                onCreateNew={() => {
                  clearForm();
                  setActiveTab('form');
                }}
              />
            </div>
          </div>
        )}
        {activeTab === 'templates' && (
          <TemplatesManager
            user={user}
            templates={userTemplates}
            loadingTemplates={isLoadingTemplates}
            errorTemplates={templateError?.message || null}
            fetchTemplates={fetchTemplates}
            handleNewTemplate={handleNewTemplate}
            handleEditTemplate={handleEditTemplate}
            handleSaveTemplate={handleSaveTemplate}
            handleDeleteTemplate={handleDeleteTemplate}
            showTemplateModal={showTemplateModal}
            setShowTemplateModal={setShowTemplateModal}
            editingTemplate={editingTemplate}
            setEditingTemplate={setEditingTemplate}
            templateForm={templateForm}
            setTemplateForm={setTemplateForm}
            isSavingTemplateModal={isSavingTemplateModal}
            showDeleteConfirm={showDeleteConfirm}
            setShowDeleteConfirm={setShowDeleteConfirm}
            templateToDelete={templateToDelete}
            setTemplateToDelete={setTemplateToDelete}
            validationErrors={templateValidationErrors}
            templateError={templateError}
            onDismissError={clearTemplateErrors}
          />
        )}


      </div>
    </div>
    </Suspense>
  )
}
