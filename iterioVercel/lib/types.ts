// Tipos compartidos para el sistema de cotizaciones
// Centraliza las definiciones para evitar duplicación y mejorar mantenibilidad

export interface FormDataForSidebar {
  // Datos básicos de la cotización
  quoteTitle: string;
  clientName: string;
  
  // Datos del formulario
  destinationData: {
    pais: string;
    ciudad: string;
    año: string;
    meses: string[];
  };
  clientData: {
    cantidadPasajeros: number;
    cantidadAdultos: number;
    cantidadMenores: number;
    cantidadInfantes: number;
  };
  
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
    subtotalVuelos: number;
    subtotalHoteles: number;
    subtotalTraslados: number;
    subtotalServicios: number;
    subtotal: number;
    total: number;
    observaciones: string;
    mostrarTotal: boolean;
    mostrarCantidadPasajeros?: boolean;
    currency?: string;
  };
  
  // Flags de configuración (para acceso directo)
  mostrarCantidadPasajeros: boolean;
}

// Tipo para las props de componentes que reciben formData
export interface FormDataProps {
  formData: Partial<FormDataForSidebar>;
}

// Tipo para el estado de procesamiento
export interface ProcessingStatus {
  step: string;
  progress: number;
}

// Tipo para templates
export interface Template {
  id: string;
  user_id: string;
  name: string;
  template_data: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    logo: string | null;
    agencyName: string;
    agencyAddress: string;
    agencyPhone: string;
    agencyEmail: string;
    validityText: string;
  };
  created_at: string;
  updated_at: string;
} 