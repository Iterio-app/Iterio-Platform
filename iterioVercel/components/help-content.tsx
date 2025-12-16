import React, { useState, useEffect } from "react";
import { AlertTriangle, Info } from "lucide-react";

interface FieldValidation {
  id: string;
  label: string | ((formData: any) => string);
  required: boolean; // true = rojo, false = amarillo
  section: string;
  condition: (formData: any) => boolean; // función que evalúa si el campo está vacío
}

interface HelpContentProps {
  formData: any;
}

export const HelpContent: React.FC<HelpContentProps> = ({ formData }) => {
  const [validationErrors, setValidationErrors] = useState<Record<string, FieldValidation[]>>({});

  // Reglas de validación hardcodeadas (exactamente como en HelpSidebar original)
  const validationRules: FieldValidation[] = [
    // INFORMACIÓN GENERAL (incluye info, destino y cliente)
    {
      id: 'quote_title',
      label: 'Título de la cotización',
      required: true,
      section: 'Información General',
      condition: (data) => !data.quoteTitle?.trim()
    },
    {
      id: 'client_name',
      label: 'Nombre del cliente',
      required: true,
      section: 'Información General',
      condition: (data) => !data.clientName?.trim()
    },
    {
      id: 'destination_pais',
      label: 'País de destino',
      required: true,
      section: 'Información General',
      condition: (data) => !data.destinationData?.pais?.trim()
    },
    {
      id: 'destination_ciudad',
      label: 'Ciudad de destino',
      required: true,
      section: 'Información General',
      condition: (data) => !data.destinationData?.ciudad?.trim()
    },
    {
      id: 'destination_año',
      label: 'Año del viaje',
      required: true,
      section: 'Información General',
      condition: (data) => !data.destinationData?.año?.trim()
    },
    {
      id: 'destination_meses',
      label: 'Meses del viaje',
      required: false,
      section: 'Información General',
      condition: (data) => !data.destinationData?.meses?.length
    },
    {
      id: 'client_passengers',
      label: 'Cantidad de pasajeros',
      required: true,
      section: 'Información General',
      condition: (data) => {
        const adultos = data.clientData?.cantidadAdultos || 0;
        const menores = data.clientData?.cantidadMenores || 0;
        const infantes = data.clientData?.cantidadInfantes || 0;
        return (adultos + menores + infantes) === 0;
      }
    },
    {
      id: 'client_minors_without_adults',
      label: 'Menores viajando sin adultos',
      required: false,
      section: 'Información General',
      condition: (data) => {
        const adultos = data.clientData?.cantidadAdultos || 0;
        const menores = data.clientData?.cantidadMenores || 0;
        const infantes = data.clientData?.cantidadInfantes || 0;
        return adultos === 0 && (menores > 0 || infantes > 0);
      }
    },

    // VUELOS (solo si el modo incluye vuelos)
    {
      id: 'flights_required',
      label: 'Agregar al menos un vuelo',
      required: true,
      section: 'Vuelos',
      condition: (data) => {
        const hasFlightMode = ['flight', 'flight_hotel', 'full'].includes(data.formMode)
        return hasFlightMode && (!data.flights || data.flights.length === 0)
      }
    },
    // Generar validaciones dinámicas para cada vuelo
    ...(Array.from({ length: 10 }, (_, i) => [
      {
        id: `flight_${i + 1}_nombre`,
        label: (data: any) => {
          const hasFlightMode = ['flight', 'flight_hotel', 'full'].includes(data.formMode)
          if (!hasFlightMode || !data.flights?.length) return ''
          const flightCount = data.flights.length
          return flightCount > 1 ? `Vuelo ${i + 1}: Nombre de compañía aérea` : 'Nombre de compañía aérea'
        },
        required: true,
        section: 'Vuelos',
        condition: (data: any) => {
          const hasFlightMode = ['flight', 'flight_hotel', 'full'].includes(data.formMode)
          if (!hasFlightMode || !data.flights?.[i]) return false
          return !data.flights[i].nombre?.trim()
        }
      },
      {
        id: `flight_${i + 1}_fechas`,
        label: (data: any) => {
          const hasFlightMode = ['flight', 'flight_hotel', 'full'].includes(data.formMode)
          if (!hasFlightMode || !data.flights?.length) return ''
          const flightCount = data.flights.length
          return flightCount > 1 ? `Vuelo ${i + 1}: Fechas del vuelo` : 'Fechas del vuelo'
        },
        required: true,
        section: 'Vuelos',
        condition: (data: any) => {
          const hasFlightMode = ['flight', 'flight_hotel', 'full'].includes(data.formMode)
          if (!hasFlightMode || !data.flights?.[i]) return false
          return !data.flights[i].fechaSalida?.trim() || !data.flights[i].fechaRetorno?.trim()
        }
      },
      {
        id: `flight_${i + 1}_precio_adulto`,
        label: (data: any) => {
          const hasFlightMode = ['flight', 'flight_hotel', 'full'].includes(data.formMode)
          if (!hasFlightMode || !data.flights?.length) return ''
          const flightCount = data.flights.length
          return flightCount > 1 ? `Vuelo ${i + 1}: Tarifa de Adulto` : 'Tarifa de Adulto'
        },
        required: true,
        section: 'Vuelos',
        condition: (data: any) => {
          const hasFlightMode = ['flight', 'flight_hotel', 'full'].includes(data.formMode)
          if (!hasFlightMode || !data.flights?.[i]) return false
          const flight = data.flights[i]
          // Verificar que haya al menos un precio configurado para adultos
          const hasAdultPrice = flight.mostrarPrecioAdultoMochila && flight.precioAdultoMochila?.trim() ||
                               flight.mostrarPrecioAdultoMochilaCarryOn && flight.precioAdultoMochilaCarryOn?.trim() ||
                               flight.mostrarPrecioAdultoMochilaBodega && flight.precioAdultoMochilaBodega?.trim() ||
                               (flight.mostrarPrecioAdultoMochilaCarryOnBodega ?? flight.mostrarPrecioAdultoMochilaCarryOnValija) && (flight.precioAdultoMochilaCarryOnBodega?.trim() || flight.precioAdultoMochilaCarryOnValija?.trim())
          
          return !hasAdultPrice
        }
      },
      {
        id: `flight_${i + 1}_precio_menor`,
        label: (data: any) => {
          const hasFlightMode = ['flight', 'flight_hotel', 'full'].includes(data.formMode)
          if (!hasFlightMode || !data.flights?.length) return ''
          const flightCount = data.flights.length
          return flightCount > 1 ? `Vuelo ${i + 1}: Tarifa de Menor` : 'Tarifa de Menor'
        },
        required: true,
        section: 'Vuelos',
        condition: (data: any) => {
          const hasFlightMode = ['flight', 'flight_hotel', 'full'].includes(data.formMode)
          if (!hasFlightMode || !data.flights?.[i]) return false
          // Solo validar si hay menores en el viaje
          if (!data.clientData?.cantidadMenores || data.clientData.cantidadMenores === 0) return false
          const flight = data.flights[i]
          // Verificar que haya al menos un precio configurado para menores
          const hasMinorPrice = flight.mostrarPrecioMenorMochila && flight.precioMenorMochila?.trim() ||
                               flight.mostrarPrecioMenorMochilaCarryOn && flight.precioMenorMochilaCarryOn?.trim() ||
                               flight.mostrarPrecioMenorMochilaBodega && flight.precioMenorMochilaBodega?.trim() ||
                               (flight.mostrarPrecioMenorMochilaCarryOnBodega ?? flight.mostrarPrecioMenorMochilaCarryOnValija) && (flight.precioMenorMochilaCarryOnBodega?.trim() || flight.precioMenorMochilaCarryOnValija?.trim())
          
          return !hasMinorPrice
        }
      },
      {
        id: `flight_${i + 1}_precio_infante`,
        label: (data: any) => {
          const hasFlightMode = ['flight', 'flight_hotel', 'full'].includes(data.formMode)
          if (!hasFlightMode || !data.flights?.length) return ''
          const flightCount = data.flights.length
          return flightCount > 1 ? `Vuelo ${i + 1}: Tarifa de Infante` : 'Tarifa de Infante'
        },
        required: true,
        section: 'Vuelos',
        condition: (data: any) => {
          const hasFlightMode = ['flight', 'flight_hotel', 'full'].includes(data.formMode)
          if (!hasFlightMode || !data.flights?.[i]) return false
          // Solo validar si hay infantes en el viaje
          if (!data.clientData?.cantidadInfantes || data.clientData.cantidadInfantes === 0) return false
          const flight = data.flights[i]
          // Verificar que haya precio configurado para infantes
          const hasInfantPrice = flight.mostrarPrecioInfante && flight.precioInfante?.trim()
          
          return !hasInfantPrice
        }
      },
      // Validaciones de precios en 0 para vuelos
      {
        id: `flight_${i + 1}_precio_adulto_cero`,
        label: (data: any) => {
          const hasFlightMode = ['flight', 'flight_hotel', 'full'].includes(data.formMode)
          if (!hasFlightMode || !data.flights?.length) return ''
          const flightCount = data.flights.length
          return flightCount > 1 ? `Vuelo ${i + 1}: La Tarifa de Adulto es 0` : 'La Tarifa de Adulto es 0'
        },
        required: false,
        section: 'Vuelos',
        condition: (data: any) => {
          const hasFlightMode = ['flight', 'flight_hotel', 'full'].includes(data.formMode)
          if (!hasFlightMode || !data.flights?.[i]) return false
          if (!data.clientData?.cantidadAdultos || data.clientData.cantidadAdultos === 0) return false
          const flight = data.flights[i]
          // Verificar si hay algún precio configurado pero es 0 o menor
          const adultPrices = [
            { price: flight.precioAdultoMochila, show: flight.mostrarPrecioAdultoMochila },
            { price: flight.precioAdultoMochilaCarryOn, show: flight.mostrarPrecioAdultoMochilaCarryOn },
            { price: flight.precioAdultoMochilaBodega, show: flight.mostrarPrecioAdultoMochilaBodega },
            { price: flight.precioAdultoMochilaCarryOnBodega || flight.precioAdultoMochilaCarryOnValija, show: flight.mostrarPrecioAdultoMochilaCarryOnBodega ?? flight.mostrarPrecioAdultoMochilaCarryOnValija }
          ].filter(item => item.show && item.price)
          return adultPrices.length > 0 && adultPrices.every(item => Number(item.price) <= 0)
        }
      },
      {
        id: `flight_${i + 1}_precio_menor_cero`,
        label: (data: any) => {
          const hasFlightMode = ['flight', 'flight_hotel', 'full'].includes(data.formMode)
          if (!hasFlightMode || !data.flights?.length) return ''
          const flightCount = data.flights.length
          return flightCount > 1 ? `Vuelo ${i + 1}: La Tarifa de Menor es 0` : 'La Tarifa de Menor es 0'
        },
        required: false,
        section: 'Vuelos',
        condition: (data: any) => {
          const hasFlightMode = ['flight', 'flight_hotel', 'full'].includes(data.formMode)
          if (!hasFlightMode || !data.flights?.[i]) return false
          if (!data.clientData?.cantidadMenores || data.clientData.cantidadMenores === 0) return false
          const flight = data.flights[i]
          // Verificar si hay algún precio configurado pero es 0 o menor
          const minorPrices = [
            { price: flight.precioMenorMochila, show: flight.mostrarPrecioMenorMochila },
            { price: flight.precioMenorMochilaCarryOn, show: flight.mostrarPrecioMenorMochilaCarryOn },
            { price: flight.precioMenorMochilaBodega, show: flight.mostrarPrecioMenorMochilaBodega },
            { price: flight.precioMenorMochilaCarryOnBodega || flight.precioMenorMochilaCarryOnValija, show: flight.mostrarPrecioMenorMochilaCarryOnBodega ?? flight.mostrarPrecioMenorMochilaCarryOnValija }
          ].filter(item => item.show && item.price)
          return minorPrices.length > 0 && minorPrices.every(item => Number(item.price) <= 0)
        }
      },
      {
        id: `flight_${i + 1}_precio_infante_cero`,
        label: (data: any) => {
          const hasFlightMode = ['flight', 'flight_hotel', 'full'].includes(data.formMode)
          if (!hasFlightMode || !data.flights?.length) return ''
          const flightCount = data.flights.length
          return flightCount > 1 ? `Vuelo ${i + 1}: La Tarifa de Infante es 0` : 'La Tarifa de Infante es 0'
        },
        required: false,
        section: 'Vuelos',
        condition: (data: any) => {
          const hasFlightMode = ['flight', 'flight_hotel', 'full'].includes(data.formMode)
          if (!hasFlightMode || !data.flights?.[i]) return false
          if (!data.clientData?.cantidadInfantes || data.clientData.cantidadInfantes === 0) return false
          const flight = data.flights[i]
          // Verificar si hay precio configurado pero es 0 o menor
          return flight.precioInfante && flight.mostrarPrecioInfante && Number(flight.precioInfante) <= 0
        }
      },
      {
        id: `flight_${i + 1}_tipo_tarifa`,
        label: (data: any) => {
          const hasFlightMode = ['flight', 'flight_hotel', 'full'].includes(data.formMode)
          if (!hasFlightMode || !data.flights?.length) return ''
          const flightCount = data.flights.length
          return flightCount > 1 ? `Vuelo ${i + 1}: Tipo de tarifa` : 'Tipo de tarifa'
        },
        required: false,
        section: 'Vuelos',
        condition: (data: any) => {
          const hasFlightMode = ['flight', 'flight_hotel', 'full'].includes(data.formMode)
          if (!hasFlightMode || !data.flights?.[i]) return false
          return !data.flights[i].tipoTarifa?.trim()
        }
      },
      {
        id: `flight_${i + 1}_condiciones_tarifa`,
        label: (data: any) => {
          const hasFlightMode = ['flight', 'flight_hotel', 'full'].includes(data.formMode)
          if (!hasFlightMode || !data.flights?.length) return ''
          const flightCount = data.flights.length
          return flightCount > 1 ? `Vuelo ${i + 1}: Condiciones de tarifa` : 'Condiciones de tarifa'
        },
        required: false,
        section: 'Vuelos',
        condition: (data: any) => {
          const hasFlightMode = ['flight', 'flight_hotel', 'full'].includes(data.formMode)
          if (!hasFlightMode || !data.flights?.[i]) return false
          return !data.flights[i].condicionesTarifa?.length
        }
      },
      {
        id: `flight_${i + 1}_requisitos_migratorios`,
        label: (data: any) => {
          const hasFlightMode = ['flight', 'flight_hotel', 'full'].includes(data.formMode)
          if (!hasFlightMode || !data.flights?.length) return ''
          const flightCount = data.flights.length
          return flightCount > 1 ? `Vuelo ${i + 1}: Requisitos migratorios` : 'Requisitos migratorios'
        },
        required: false,
        section: 'Vuelos',
        condition: (data: any) => {
          const hasFlightMode = ['flight', 'flight_hotel', 'full'].includes(data.formMode)
          if (!hasFlightMode || !data.flights?.[i]) return false
          return !data.flights[i].requisitosMigratorios?.length
        }
      }
    ]).flat()),
    
    // ALOJAMIENTO (solo si el modo incluye alojamiento)
    {
      id: 'accommodations_required',
      label: 'Agregar al menos un alojamiento',
      required: true,
      section: 'Alojamiento',
      condition: (data) => {
        const hasAccommodationMode = ['flight_hotel', 'full'].includes(data.formMode)
        return hasAccommodationMode && (!data.accommodations || data.accommodations.length === 0)
      }
    },
    // Generar validaciones dinámicas para cada alojamiento y habitación
    ...((formData?.accommodations || []).flatMap((accommodation: any, aIdx: number) => {
      const rules: FieldValidation[] = [];
      const prefix = formData.accommodations.length > 1 ? `Alojamiento ${aIdx + 1}: ` : '';
      // Reglas generales por alojamiento (siempre)
      rules.push({
        id: `accommodation_${aIdx + 1}_nombre`,
        label: `${prefix}Nombre del alojamiento`,
        required: true,
        section: 'Alojamiento',
        condition: (_data: any) => !accommodation.nombre?.trim(),
      });
      rules.push({
        id: `accommodation_${aIdx + 1}_ciudad`,
        label: `${prefix}Ciudad del alojamiento`,
        required: true,
        section: 'Alojamiento',
        condition: (_data: any) => !accommodation.ciudad?.trim(),
      });
      rules.push({
        id: `accommodation_${aIdx + 1}_fechas`,
        label: `${prefix}Fechas de alojamiento`,
        required: true,
        section: 'Alojamiento',
        condition: (_data: any) => !accommodation.checkin?.trim() || !accommodation.checkout?.trim(),
      });
      // Reglas por habitación (siempre, para cada habitación)
      if (accommodation.habitaciones && accommodation.habitaciones.length > 0) {
        accommodation.habitaciones.forEach((room: any, hIdx: number) => {
          rules.push({
            id: `accommodation_${aIdx + 1}_room_${hIdx + 1}_precio`,
            label: `${prefix}Precio de habitación ${hIdx + 1}`,
            required: true,
            section: 'Alojamiento',
            condition: (_data: any) => !room.precio?.trim(),
          });
          // Validación de precio en 0 para habitación
          rules.push({
            id: `accommodation_${aIdx + 1}_room_${hIdx + 1}_precio_cero`,
            label: `${prefix}El precio de la habitación ${hIdx + 1} es 0`,
            required: false,
            section: 'Alojamiento',
            condition: (_data: any) => room.precio?.trim() && Number(room.precio) <= 0,
          });
        });
        accommodation.habitaciones.forEach((room: any, hIdx: number) => {
          rules.push({
            id: `accommodation_${aIdx + 1}_room_${hIdx + 1}_info`,
            label: `${prefix}Información de habitación ${hIdx + 1}`,
            required: false,
            section: 'Alojamiento',
            condition: (_data: any) => {
              return !room.tipoHabitacion?.trim() || !room.regimenTouched;
            },
          });
        });
      }
      return rules;
    })),
    
    // TRASLADOS (solo si es modo completo)
    {
      id: 'transfers_required',
      label: 'Agregar traslados',
      required: false,
      section: 'Traslados',
      condition: (data) => {
        const isFullMode = data.formMode === 'full'
        return isFullMode && (!data.transfers || data.transfers.length === 0)
      }
    },
    // Generar validaciones dinámicas para cada traslado
    ...(Array.from({ length: 10 }, (_, i) => [
      {
        id: `transfer_${i + 1}_nombre`,
        label: (data: any) => {
          const isFullMode = data.formMode === 'full'
          if (!isFullMode || !data.transfers?.length) return ''
          const transferCount = data.transfers.length
          return transferCount > 1 ? `Traslado ${i + 1}: Nombre de la empresa` : 'Nombre de la empresa'
        },
        required: true,
        section: 'Traslados',
        condition: (data: any) => {
          const isFullMode = data.formMode === 'full'
          if (!isFullMode || !data.transfers?.[i]) return false
          return !data.transfers[i].nombre?.trim()
        }
      },
      {
        id: `transfer_${i + 1}_origen_destino`,
        label: (data: any) => {
          const isFullMode = data.formMode === 'full'
          if (!isFullMode || !data.transfers?.length) return ''
          const transferCount = data.transfers.length
          return transferCount > 1 ? `Traslado ${i + 1}: Origen y destino` : 'Origen y destino'
        },
        required: true,
        section: 'Traslados',
        condition: (data: any) => {
          const isFullMode = data.formMode === 'full'
          if (!isFullMode || !data.transfers?.[i]) return false
          return !data.transfers[i].origen?.trim() || !data.transfers[i].destino?.trim()
        }
      },
      {
        id: `transfer_${i + 1}_tipo`,
        label: (data: any) => {
          const isFullMode = data.formMode === 'full'
          if (!isFullMode || !data.transfers?.length) return ''
          const transferCount = data.transfers.length
          return transferCount > 1 ? `Traslado ${i + 1}: Tipo de traslado` : 'Tipo de traslado'
        },
        required: true,
        section: 'Traslados',
        condition: (data: any) => {
          const isFullMode = data.formMode === 'full'
          if (!isFullMode || !data.transfers?.[i]) return false
          return !data.transfers[i].tipoTraslado?.trim()
        }
      },
      {
        id: `transfer_${i + 1}_fecha_hora`,
        label: (data: any) => {
          const isFullMode = data.formMode === 'full'
          if (!isFullMode || !data.transfers?.length) return ''
          const transferCount = data.transfers.length
          return transferCount > 1 ? `Traslado ${i + 1}: Fecha y hora` : 'Fecha y hora'
        },
        required: true,
        section: 'Traslados',
        condition: (data: any) => {
          const isFullMode = data.formMode === 'full'
          if (!isFullMode || !data.transfers?.[i]) return false
          return !data.transfers[i].fecha?.trim() || !data.transfers[i].hora?.trim()
        }
      },
      {
        id: `transfer_${i + 1}_precio`,
        label: (data: any) => {
          const isFullMode = data.formMode === 'full'
          if (!isFullMode || !data.transfers?.length) return ''
          const transferCount = data.transfers.length
          return transferCount > 1 ? `Traslado ${i + 1}: Precio` : 'Precio'
        },
        required: true,
        section: 'Traslados',
        condition: (data: any) => {
          const isFullMode = data.formMode === 'full'
          if (!isFullMode || !data.transfers?.[i]) return false
          return !data.transfers[i].precio?.trim()
        }
      },
      {
        id: `transfer_${i + 1}_precio_cero`,
        label: (data: any) => {
          const isFullMode = data.formMode === 'full'
          if (!isFullMode || !data.transfers?.length) return ''
          const transferCount = data.transfers.length
          return transferCount > 1 ? `Traslado ${i + 1}: El precio del traslado es 0` : 'El precio del traslado es 0'
        },
        required: false,
        section: 'Traslados',
        condition: (data: any) => {
          const isFullMode = data.formMode === 'full'
          if (!isFullMode || !data.transfers?.[i]) return false
          return data.transfers[i].precio?.trim() && Number(data.transfers[i].precio) <= 0
        }
      }
    ]).flat()),
    
    // SERVICIOS ADICIONALES (solo si es modo completo)
    {
      id: 'services_required',
      label: 'Agregar servicios adicionales',
      required: false,
      section: 'Servicios Adicionales',
      condition: (data) => {
        const isFullMode = data.formMode === 'full'
        return isFullMode && (!data.services || data.services.length === 0)
      }
    },
    // Generar validaciones dinámicas para cada servicio
    ...(Array.from({ length: 10 }, (_, i) => [
      {
        id: `service_${i + 1}_nombre`,
        label: (data: any) => {
          const isFullMode = data.formMode === 'full'
          if (!isFullMode || !data.services?.length) return ''
          const serviceCount = data.services.length
          return serviceCount > 1 ? `Servicio ${i + 1}: Nombre del servicio` : 'Nombre del servicio'
        },
        required: true,
        section: 'Servicios Adicionales',
        condition: (data: any) => {
          const isFullMode = data.formMode === 'full'
          if (!isFullMode || !data.services?.[i]) return false
          return !data.services[i].nombre?.trim()
        }
      },
      {
        id: `service_${i + 1}_descripcion`,
        label: (data: any) => {
          const isFullMode = data.formMode === 'full'
          if (!isFullMode || !data.services?.length) return ''
          const serviceCount = data.services.length
          return serviceCount > 1 ? `Servicio ${i + 1}: Descripción` : 'Descripción'
        },
        required: false,
        section: 'Servicios Adicionales',
        condition: (data: any) => {
          const isFullMode = data.formMode === 'full'
          if (!isFullMode || !data.services?.[i]) return false
          return !data.services[i].descripcion?.trim()
        }
      },
      {
        id: `service_${i + 1}_fecha`,
        label: (data: any) => {
          const isFullMode = data.formMode === 'full'
          if (!isFullMode || !data.services?.length) return ''
          const serviceCount = data.services.length
          return serviceCount > 1 ? `Servicio ${i + 1}: Fecha` : 'Fecha'
        },
        required: false,
        section: 'Servicios Adicionales',
        condition: (data: any) => {
          const isFullMode = data.formMode === 'full'
          if (!isFullMode || !data.services?.[i]) return false
          return !data.services[i].fecha?.trim()
        }
      },
      {
        id: `service_${i + 1}_duracion`,
        label: (data: any) => {
          const isFullMode = data.formMode === 'full'
          if (!isFullMode || !data.services?.length) return ''
          const serviceCount = data.services.length
          return serviceCount > 1 ? `Servicio ${i + 1}: Duración` : 'Duración'
        },
        required: false,
        section: 'Servicios Adicionales',
        condition: (data: any) => {
          const isFullMode = data.formMode === 'full'
          if (!isFullMode || !data.services?.[i]) return false
          return !data.services[i].duracion?.trim()
        }
      },
      {
        id: `service_${i + 1}_precio`,
        label: (data: any) => {
          const isFullMode = data.formMode === 'full'
          if (!isFullMode || !data.services?.length) return ''
          const serviceCount = data.services.length
          return serviceCount > 1 ? `Servicio ${i + 1}: Precio` : 'Precio'
        },
        required: true,
        section: 'Servicios Adicionales',
        condition: (data: any) => {
          const isFullMode = data.formMode === 'full'
          if (!isFullMode || !data.services?.[i]) return false
          return !data.services[i].precio?.trim()
        }
      },
      {
        id: `service_${i + 1}_precio_cero`,
        label: (data: any) => {
          const isFullMode = data.formMode === 'full'
          if (!isFullMode || !data.services?.length) return ''
          const serviceCount = data.services.length
          return serviceCount > 1 ? `Servicio ${i + 1}: El precio del servicio es 0` : 'El precio del servicio es 0'
        },
        required: false,
        section: 'Servicios Adicionales',
        condition: (data: any) => {
          const isFullMode = data.formMode === 'full'
          if (!isFullMode || !data.services?.[i]) return false
          return data.services[i].precio?.trim() && Number(data.services[i].precio) <= 0
        }
      }
    ]).flat()),

    // CRUCEROS - Obligatorio en modo cruise, opcional (advertencia) en modo full
    {
      id: 'cruises_required',
      label: 'Agregar al menos un crucero',
      required: true,
      section: 'Cruceros',
      condition: (data) => {
        return data.formMode === 'cruise' && (!data.cruises || data.cruises.length === 0)
      }
    },
    {
      id: 'cruises_optional',
      label: 'Agregar cruceros',
      required: false,
      section: 'Cruceros',
      condition: (data) => {
        return data.formMode === 'full' && (!data.cruises || data.cruises.length === 0)
      }
    },
    // Generar validaciones dinámicas para cada crucero
    ...(Array.from({ length: 5 }, (_, i) => [
      {
        id: `cruise_${i + 1}_empresa`,
        label: (data: any) => {
          const hasCruiseMode = ['cruise', 'full'].includes(data.formMode)
          if (!hasCruiseMode || !data.cruises?.length) return ''
          const cruiseCount = data.cruises.length
          return cruiseCount > 1 ? `Crucero ${i + 1}: Empresa` : 'Empresa'
        },
        required: true,
        section: 'Cruceros',
        condition: (data: any) => {
          const hasCruiseMode = ['cruise', 'full'].includes(data.formMode)
          if (!hasCruiseMode || !data.cruises?.[i]) return false
          return !data.cruises[i].empresa?.trim()
        }
      },
      {
        id: `cruise_${i + 1}_nombreBarco`,
        label: (data: any) => {
          const hasCruiseMode = ['cruise', 'full'].includes(data.formMode)
          if (!hasCruiseMode || !data.cruises?.length) return ''
          const cruiseCount = data.cruises.length
          return cruiseCount > 1 ? `Crucero ${i + 1}: Nombre del barco` : 'Nombre del barco'
        },
        required: true,
        section: 'Cruceros',
        condition: (data: any) => {
          const hasCruiseMode = ['cruise', 'full'].includes(data.formMode)
          if (!hasCruiseMode || !data.cruises?.[i]) return false
          return !data.cruises[i].nombreBarco?.trim()
        }
      },
      {
        id: `cruise_${i + 1}_destino`,
        label: (data: any) => {
          const hasCruiseMode = ['cruise', 'full'].includes(data.formMode)
          if (!hasCruiseMode || !data.cruises?.length) return ''
          const cruiseCount = data.cruises.length
          return cruiseCount > 1 ? `Crucero ${i + 1}: Destino` : 'Destino'
        },
        required: true,
        section: 'Cruceros',
        condition: (data: any) => {
          const hasCruiseMode = ['cruise', 'full'].includes(data.formMode)
          if (!hasCruiseMode || !data.cruises?.[i]) return false
          return !data.cruises[i].destino?.trim()
        }
      },
      {
        id: `cruise_${i + 1}_fechas`,
        label: (data: any) => {
          const hasCruiseMode = ['cruise', 'full'].includes(data.formMode)
          if (!hasCruiseMode || !data.cruises?.length) return ''
          const cruiseCount = data.cruises.length
          return cruiseCount > 1 ? `Crucero ${i + 1}: Fechas de partida y regreso` : 'Fechas de partida y regreso'
        },
        required: true,
        section: 'Cruceros',
        condition: (data: any) => {
          const hasCruiseMode = ['cruise', 'full'].includes(data.formMode)
          if (!hasCruiseMode || !data.cruises?.[i]) return false
          return !data.cruises[i].fechaPartida?.trim() || !data.cruises[i].fechaRegreso?.trim()
        }
      },
      {
        id: `cruise_${i + 1}_tipoCabina`,
        label: (data: any) => {
          const hasCruiseMode = ['cruise', 'full'].includes(data.formMode)
          if (!hasCruiseMode || !data.cruises?.length) return ''
          const cruiseCount = data.cruises.length
          return cruiseCount > 1 ? `Crucero ${i + 1}: Tipo de cabina` : 'Tipo de cabina'
        },
        required: true,
        section: 'Cruceros',
        condition: (data: any) => {
          const hasCruiseMode = ['cruise', 'full'].includes(data.formMode)
          if (!hasCruiseMode || !data.cruises?.[i]) return false
          return !data.cruises[i].tipoCabina?.trim()
        }
      },
      {
        id: `cruise_${i + 1}_precio`,
        label: (data: any) => {
          const hasCruiseMode = ['cruise', 'full'].includes(data.formMode)
          if (!hasCruiseMode || !data.cruises?.length) return ''
          const cruiseCount = data.cruises.length
          return cruiseCount > 1 ? `Crucero ${i + 1}: Precio` : 'Precio'
        },
        required: true,
        section: 'Cruceros',
        condition: (data: any) => {
          const hasCruiseMode = ['cruise', 'full'].includes(data.formMode)
          if (!hasCruiseMode || !data.cruises?.[i]) return false
          return !data.cruises[i].precio?.trim()
        }
      },
      {
        id: `cruise_${i + 1}_precio_cero`,
        label: (data: any) => {
          const hasCruiseMode = ['cruise', 'full'].includes(data.formMode)
          if (!hasCruiseMode || !data.cruises?.length) return ''
          const cruiseCount = data.cruises.length
          return cruiseCount > 1 ? `Crucero ${i + 1}: El precio del crucero es 0` : 'El precio del crucero es 0'
        },
        required: false,
        section: 'Cruceros',
        condition: (data: any) => {
          const hasCruiseMode = ['cruise', 'full'].includes(data.formMode)
          if (!hasCruiseMode || !data.cruises?.[i]) return false
          return data.cruises[i].precio?.trim() && Number(data.cruises[i].precio) <= 0
        }
      }
    ]).flat())
  ];

  // Calcular errores de validación
  useEffect(() => {
    const errors = validationRules
      .filter(rule => rule.condition(formData))
      .reduce((acc, rule) => {
        if (!acc[rule.section]) acc[rule.section] = []
        acc[rule.section].push(rule)
        return acc
      }, {} as Record<string, FieldValidation[]>)
    
    setValidationErrors(errors)
  }, [formData])

  const totalErrors = Object.values(validationErrors).flat().length
  const requiredErrors = Object.values(validationErrors).flat().filter(error => error.required).length
  const optionalErrors = totalErrors - requiredErrors

  if (Object.keys(validationErrors).length === 0) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-green-600 text-xl">✅</span>
        </div>
        <p className="text-green-700 font-medium">¡Formulario completo!</p>
        <p className="text-green-600 text-sm mt-1">Todos los campos obligatorios están completados</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(validationErrors).map(([section, sectionErrors]) => (
        <div key={section} className="border-l-4 border-blue-500 pl-3">
          <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
            {section}
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {sectionErrors.length}
            </span>
          </h4>
          <ul className="space-y-2">
            {sectionErrors.map(error => (
              <li key={error.id} className="flex items-start gap-2 text-sm">
                <span className={`mt-0.5 ${error.required ? 'text-red-500' : 'text-yellow-500'}`}>
                  {error.required ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Info className="w-4 h-4" />
                  )}
                </span>
                <span className={`${error.required ? 'text-red-700' : 'text-yellow-700'} leading-relaxed`}>
                  {typeof error.label === 'function' ? error.label(formData) : error.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}; 