import React from "react";
import { Calculator, Plane, Building, Car, Ticket, Users, MapPin, Ship } from "lucide-react";
import { groupAmountsByCurrency } from "@/lib/utils";
import { FormDataProps } from "@/lib/types";

export const SummaryContent: React.FC<FormDataProps> = ({ formData }) => {
  // Función helper para obtener el valor de mostrarCantidadPasajeros de manera robusta
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

  // Utilidad para mostrar meses como rango legible
  function formatMeses(meses: string[]) {
    if (!meses || meses.length === 0) return null;
    const mesesNombres = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const nums = meses.map(m => parseInt(m, 10)).filter(n => !isNaN(n)).sort((a, b) => a - b);
    if (nums.length === 1) return mesesNombres[nums[0] - 1];
    if (nums.length > 1) return `${mesesNombres[nums[0] - 1]} a ${mesesNombres[nums[nums.length - 1] - 1]}`;
    return null;
  }

  // Utilidad para mostrar el label de la moneda
  function getMonedaLabel(currency: string | undefined) {
    if (!currency) return null;
    if (currency === 'USD') return 'USD - Dólar Estadounidense';
    if (currency === 'EUR') return 'EUR - Euro';  
    if (currency === 'ARS') return 'ARS - Peso Argentino';
    return currency;
  }

  // Utilidad para mostrar símbolo de moneda
  function getCurrencySymbol(currency: string) {
    if (!currency) return '';
    return currency.toUpperCase();
  }

  // Utilidad para mostrar label legible de tipo de tarifa
  function getTarifaLabel(tipo: string) {
    if (!tipo) return '';
    if (tipo === 'economy') return 'Economy';
    if (tipo === 'premium_economy') return 'Premium Economy';
    if (tipo === 'business') return 'Business';
    if (tipo === 'first') return 'First';
    return tipo;
  }

  // Utilidad para mostrar label legible de régimen de comida
  function getRegimenLabel(regimen: string) {
    if (!regimen) return '';
    if (regimen === 'sin_desayuno') return 'Sin desayuno';
    if (regimen === 'desayuno') return 'Desayuno';
    if (regimen === 'media_pension') return 'Media pensión';
    if (regimen === 'pension_completa') return 'Pensión completa';
    if (regimen === 'all_inclusive') return 'All inclusive';
    return regimen;
  }

  // Utilidad para mostrar label legible de tipo de traslado
  function getTipoTrasladoLabel(tipo: string) {
    if (!tipo) return '';
    if (tipo.toLowerCase() === 'regular') return 'Regular';
    if (tipo.toLowerCase() === 'privado') return 'Privado';
    return tipo.charAt(0).toUpperCase() + tipo.slice(1);
  }

  // Utilidad para formatear fechas en formato DD/MM/YYYY
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

  // Año por defecto
  const defaultYear = new Date().getFullYear().toString();

  // Solo mostrar moneda si no es el valor por defecto
  const showMoneda = formData.selectedCurrency && formData.selectedCurrency !== 'USD';

  // Datos generales: moneda, destino, año, cliente
  const hasDatosGenerales =
    !!formData.selectedCurrency ||
    !!formData.destinationData?.pais ||
    !!formData.destinationData?.ciudad ||
    !!formData.destinationData?.año ||
    (formData.destinationData?.meses && formData.destinationData.meses.length > 0) ||
    !!formData.clientData?.cantidadPasajeros ||
    !!formData.clientData?.cantidadAdultos ||
    !!formData.clientData?.cantidadMenores ||
    !!formData.clientData?.cantidadInfantes;

  // Servicios
  const hasServicios = formData.services && formData.services.length > 0;
  // Vuelos
  const hasVuelos = formData.flights && formData.flights.length > 0;
  // Alojamiento
  const hasAlojamiento = formData.accommodations && formData.accommodations.length > 0;
  // Traslados
  const hasTraslados = formData.transfers && formData.transfers.length > 0;
  // Cruceros
  const hasCruceros = formData.cruises && formData.cruises.length > 0;

  // Calcular totales
  const accommodationTotals = groupAmountsByCurrency(formData.accommodations || [], formData.selectedCurrency || 'USD', 'precioTotal');
  const transferTotals = groupAmountsByCurrency(formData.transfers || [], formData.selectedCurrency || 'USD', 'precio');
  const serviceTotals = groupAmountsByCurrency(formData.services || [], formData.selectedCurrency || 'USD', 'precio');
  const cruiseTotals = groupAmountsByCurrency(formData.cruises || [], formData.selectedCurrency || 'USD', 'precio');
  
  const allTotals: Record<string, number> = {};
  [accommodationTotals, transferTotals, serviceTotals, cruiseTotals].forEach(sectionTotals => {
    Object.entries(sectionTotals).forEach(([currency, amount]) => {
      allTotals[currency] = (allTotals[currency] || 0) + amount;
    });
  });

  // Totales - mostrar siempre que haya algún dato, incluso si es 0
  const hasTotales = (formData.accommodations?.length || 0) > 0 || (formData.transfers?.length || 0) > 0 || (formData.services?.length || 0) > 0 || (formData.cruises?.length || 0) > 0;

  return (
    <div className="space-y-4">
      {hasDatosGenerales && (
        <div className="border-l-4 border-blue-500 pl-3">
          <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            Datos Generales
          </h4>
          <div className="space-y-2">
            <div className="text-sm text-gray-700">
              <span className="font-medium">Moneda global:</span>{" "}
              {formData.selectedCurrency === "USD" ? (
                <span className="whitespace-nowrap">USD - Dólar Estadounidense</span>
              ) : (
                getMonedaLabel(formData.selectedCurrency)
              )}
            </div>
            {formData.destinationData?.pais && (
              <div className="text-sm text-gray-700">
                <span className="font-medium">País:</span> {formData.destinationData.pais}
              </div>
            )}
            {formData.destinationData?.ciudad && (
              <div className="text-sm text-gray-700">
                <span className="font-medium">Ciudad:</span> {formData.destinationData.ciudad}
              </div>
            )}
            <div className="text-sm text-gray-700">
              <span className="font-medium">Año:</span> {formData.destinationData?.año}
              {formData.destinationData?.año === defaultYear && <span className="text-gray-400 text-xs ml-1">(por defecto)</span>}
            </div>
            {formData.destinationData?.meses && formData.destinationData.meses.length > 0 && (
              <div className="text-sm text-gray-700">
                <span className="font-medium">Meses:</span> {formatMeses(formData.destinationData.meses)}
              </div>
            )}
            {(getMostrarCantidadPasajeros()) &&
              ((formData.clientData?.cantidadAdultos || 0) > 0 || (formData.clientData?.cantidadMenores || 0) > 0 || (formData.clientData?.cantidadInfantes || 0) > 0) && (
                <div className="space-y-1">
                  <div className="text-sm text-gray-700 font-medium">Pasajeros:</div>
                  <div className="ml-4 space-y-1">
                    {(formData.clientData?.cantidadAdultos || 0) > 0 && (
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">• Adultos:</span> {formData.clientData?.cantidadAdultos}
                      </div>
                    )}
                    {(formData.clientData?.cantidadMenores || 0) > 0 && (
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">• Menores:</span> {formData.clientData?.cantidadMenores}
                      </div>
                    )}
                    {(formData.clientData?.cantidadInfantes || 0) > 0 && (
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">• Infantes:</span> {formData.clientData?.cantidadInfantes}
                      </div>
                    )}
                  </div>
                </div>
            )}
          </div>
        </div>
      )}

      {hasVuelos && (
        <div className="border-l-4 border-blue-500 pl-3">
          <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Plane className="h-4 w-4 text-blue-600" />
            Vuelos
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {formData.flights?.length || 0}
            </span>
          </h4>
          <div className="space-y-4">
            {formData.flights?.map((vuelo: any, idx: number) => {
              const compania = vuelo.nombre || vuelo.compania || vuelo.aerolinea || "";
              return (
                <div key={idx} className="mb-3 pb-3 border-b border-gray-100 last:border-b-0">
                  <div className="font-medium text-sm text-blue-900 mb-2">
                    {`Vuelo${(vuelo.destino || formData.destinationData?.ciudad) ? ` a ${vuelo.destino || formData.destinationData?.ciudad}`:` ${idx + 1}`}`}
                  </div>
                  <div className="space-y-2">
                    {compania && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Compañía aérea:</span> {compania}
                      </div>
                    )}
                    {vuelo.fechaSalida && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Fecha de salida:</span> {formatDate(vuelo.fechaSalida)}
                      </div>
                    )}
                    {(vuelo.fechaLlegada || vuelo.fechaRetorno) && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Fecha de llegada:</span> {formatDate(vuelo.fechaLlegada || vuelo.fechaRetorno)}
                      </div>
                    )}
                    {vuelo.tipoTarifa && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Tipo de Tarifa:</span> {getTarifaLabel(vuelo.tipoTarifa)}
                      </div>
                    )}
                    {/* Precios Adultos */}
                    {((vuelo.mostrarPrecioAdultoMochila && vuelo.precioAdultoMochila) || (vuelo.mostrarPrecioAdultoMochilaCarryOn && vuelo.precioAdultoMochilaCarryOn) || (vuelo.mostrarPrecioAdultoMochilaCarryOnValija && vuelo.precioAdultoMochilaCarryOnValija)) && (
                      <div className="space-y-1">
                        <div className="text-sm text-gray-700 font-medium">Precios Adultos:</div>
                        <div className="ml-4 space-y-1">
                          {vuelo.mostrarPrecioAdultoMochila && vuelo.precioAdultoMochila && (
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">• Solo mochila:</span> {getCurrencySymbol(vuelo.useCustomCurrency ? vuelo.currency : formData.selectedCurrency)} {vuelo.precioAdultoMochila}
                            </div>
                          )}
                          {vuelo.mostrarPrecioAdultoMochilaCarryOn && vuelo.precioAdultoMochilaCarryOn && (
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">• Mochila + Carry On:</span> {getCurrencySymbol(vuelo.useCustomCurrency ? vuelo.currency : formData.selectedCurrency)} {vuelo.precioAdultoMochilaCarryOn}
                            </div>
                          )}
                          {vuelo.mostrarPrecioAdultoMochilaCarryOnValija && vuelo.precioAdultoMochilaCarryOnValija && (
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">• Mochila + Carry On + Valija 23kg:</span> {getCurrencySymbol(vuelo.useCustomCurrency ? vuelo.currency : formData.selectedCurrency)} {vuelo.precioAdultoMochilaCarryOnValija}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Precios Menores */}
                    {((vuelo.mostrarPrecioMenorMochila && vuelo.precioMenorMochila) || (vuelo.mostrarPrecioMenorMochilaCarryOn && vuelo.precioMenorMochilaCarryOn) || (vuelo.mostrarPrecioMenorMochilaCarryOnValija && vuelo.precioMenorMochilaCarryOnValija)) && (
                      <div className="space-y-1">
                        <div className="text-sm text-gray-700 font-medium">Precios Menores:</div>
                        <div className="ml-4 space-y-1">
                          {vuelo.mostrarPrecioMenorMochila && vuelo.precioMenorMochila && (
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">• Solo mochila:</span> {getCurrencySymbol(vuelo.useCustomCurrency ? vuelo.currency : formData.selectedCurrency)} {vuelo.precioMenorMochila}
                            </div>
                          )}
                          {vuelo.mostrarPrecioMenorMochilaCarryOn && vuelo.precioMenorMochilaCarryOn && (
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">• Mochila + Carry On:</span> {getCurrencySymbol(vuelo.useCustomCurrency ? vuelo.currency : formData.selectedCurrency)} {vuelo.precioMenorMochilaCarryOn}
                            </div>
                          )}
                          {vuelo.mostrarPrecioMenorMochilaCarryOnValija && vuelo.precioMenorMochilaCarryOnValija && (
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">• Mochila + Carry On + Valija 23kg:</span> {getCurrencySymbol(vuelo.useCustomCurrency ? vuelo.currency : formData.selectedCurrency)} {vuelo.precioMenorMochilaCarryOnValija}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
                    {/* Condiciones de tarifa aérea */}
                    {vuelo.condicionesTarifa && Array.isArray(vuelo.condicionesTarifa) && vuelo.condicionesTarifa.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-sm text-gray-700 font-medium">Condiciones de tarifa aérea:</div>
                        <div className="ml-4 space-y-1">
                          {vuelo.condicionesTarifa.map((cond: string, i: number) => (
                            <div key={i} className="text-xs text-gray-600">• {cond}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Requisitos migratorios */}
                    {vuelo.requisitosMigratorios && Array.isArray(vuelo.requisitosMigratorios) && vuelo.requisitosMigratorios.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-sm text-gray-700 font-medium">Requisitos migratorios:</div>
                        <div className="ml-4 space-y-1">
                          {vuelo.requisitosMigratorios.map((req: string, i: number) => (
                            <div key={i} className="text-xs text-gray-600">• {req}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {vuelo.textoLibre && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Comentarios adicionales:</span> <span className="italic text-gray-600 font-normal">{vuelo.textoLibre}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {hasAlojamiento && (
        <div className="border-l-4 border-blue-500 pl-3">
          <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Building className="h-4 w-4 text-blue-600" />
            Alojamiento
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {formData.accommodations?.length || 0}
            </span>
          </h4>
          <div className="space-y-4">
            {formData.accommodations?.map((aloj: any, idx: number) => (
              <div key={idx} className="mb-3 pb-3 border-b border-gray-100 last:border-b-0">
                <div className="font-medium text-sm text-blue-900 mb-2">
                  {`Alojamiento${aloj.nombre ? ` en ${aloj.nombre}` : ''}`}
                </div>
                <div className="space-y-2">
                  {aloj.ciudad && (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Ciudad:</span> {aloj.ciudad}
                    </div>
                  )}
                  {aloj.checkin && (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Check-in:</span> {formatDate(aloj.checkin)}
                    </div>
                  )}
                  {aloj.checkout && (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Check-out:</span> {formatDate(aloj.checkout)}
                    </div>
                  )}
                  {aloj.cantidadNoches && (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Cantidad de noches:</span> {aloj.cantidadNoches}
                    </div>
                  )}
                  {aloj.cantidadHabitaciones && (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Cantidad de habitaciones:</span> {aloj.cantidadHabitaciones}
                    </div>
                  )}
                  {aloj.habitaciones && aloj.habitaciones.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-sm text-gray-700 font-medium">Habitaciones:</div>
                      <div className="ml-4 space-y-2">
                        {aloj.habitaciones.map((hab: any, hidx: number) => (
                          <div key={hidx} className="space-y-1">
                            <div className="text-xs text-blue-800 font-medium">• Habitación {hab.tipoHabitacion}:</div>
                            <div className="ml-4 space-y-1">
                              {hab.regimen && (
                                <div className="text-xs text-gray-500">
                                  <span className="font-medium">• Régimen de comidas:</span> {getRegimenLabel(hab.regimen)}
                                </div>
                              )}
                              {(hab.mostrarPrecio ?? true) && hab.precio && (
                                <div className="text-xs text-gray-500">
                                  <span className="font-medium">• Precio total:</span> {getCurrencySymbol(aloj.useCustomCurrency ? aloj.currency : formData.selectedCurrency)} {Number(hab.precio).toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {aloj.mostrarPrecio && aloj.precioTotal !== undefined && (
                    <div className="text-sm text-gray-700 font-semibold text-blue-800">
                      <span className="font-medium">Precio total:</span> {getCurrencySymbol(aloj.useCustomCurrency ? aloj.currency : formData.selectedCurrency)} {Number(aloj.precioTotal).toFixed(2)}
                    </div>
                  )}
                  {aloj.textoLibre && (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Comentarios adicionales:</span> <span className="italic text-gray-600 font-normal">{aloj.textoLibre}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasTraslados && (
        <div className="border-l-4 border-blue-500 pl-3">
          <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Car className="h-4 w-4 text-blue-600" />
            Traslados
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {formData.transfers?.length || 0}
            </span>
          </h4>
          <div className="space-y-4">
            {formData.transfers?.map((tras: any, idx: number) => {
              return (
                <div key={idx} className="mb-3 pb-3 border-b border-gray-100 last:border-b-0">
                  <div className="font-medium text-sm text-blue-900 mb-2">
                    {`Traslado${tras.nombre ? ` (${tras.nombre})` : ''}`}
                  </div>
                  <div className="space-y-2">
                    {tras.origen && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Origen:</span> {tras.origen}
                      </div>
                    )}
                    {tras.destino && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Destino:</span> {tras.destino}
                      </div>
                    )}
                    {tras.tipoTraslado && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Tipo de traslado:</span> {getTipoTrasladoLabel(tras.tipoTraslado)}
                      </div>
                    )}
                    {tras.fecha && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Fecha:</span> {formatDate(tras.fecha)}
                      </div>
                    )}
                    {tras.hora && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Hora:</span> {tras.hora}
                      </div>
                    )}
                    {tras.mostrarPrecio && tras.precio && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Precio:</span> {getCurrencySymbol(tras.useCustomCurrency ? tras.currency : formData.selectedCurrency)} {tras.precio}
                      </div>
                    )}
                    {tras.textoLibre && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Comentarios adicionales:</span> <span className="italic text-gray-600 font-normal">{tras.textoLibre}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {hasServicios && (
        <div className="border-l-4 border-blue-500 pl-3">
          <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Ticket className="h-4 w-4 text-blue-600" />
            Servicios Adicionales
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {formData.services?.length || 0}
            </span>
          </h4>
          <div className="space-y-4">
            {formData.services?.map((serv: any, idx: number) => {
              return (
                <div key={idx} className="mb-3 pb-3 border-b border-gray-100 last:border-b-0">
                  <div className="font-medium text-sm text-blue-900 mb-2">
                    {`Servicio${serv.nombre ? ` (${serv.nombre})` : ''}`}
                  </div>
                  <div className="space-y-2">
                    {serv.descripcion && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Descripción:</span> {serv.descripcion}
                      </div>
                    )}
                    {serv.fecha && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Fecha:</span> {formatDate(serv.fecha)}
                      </div>
                    )}
                    {serv.duracion && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Duración:</span> {serv.duracion}
                      </div>
                    )}
                    {serv.mostrarPrecio && serv.precio && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Precio:</span> {getCurrencySymbol(serv.useCustomCurrency ? serv.currency : formData.selectedCurrency)} {serv.precio}
                      </div>
                    )}
                    {serv.textoLibre && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Comentarios adicionales:</span> <span className="italic text-gray-600 font-normal">{serv.textoLibre}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {hasCruceros && (
        <div className="border-l-4 border-cyan-500 pl-3">
          <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Ship className="h-4 w-4 text-cyan-600" />
            Cruceros
            <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full">
              {formData.cruises?.length || 0}
            </span>
          </h4>
          {formData.cruises?.length === 1 && formData.cruises[0]?.empresa && formData.cruises[0]?.nombreBarco && (
            <div className="text-sm font-medium text-cyan-800 mb-2">
              {formData.cruises[0].empresa} - {formData.cruises[0].nombreBarco}
            </div>
          )}
          <div className="space-y-4">
            {formData.cruises?.map((cruise: any, idx: number) => {
              return (
                <div key={idx} className="mb-3 pb-3 border-b border-gray-100 last:border-b-0">
                  {(formData.cruises?.length || 0) > 1 && (
                    <div className="font-medium text-sm text-cyan-900 mb-2">
                      {cruise.empresa && cruise.nombreBarco 
                        ? `${cruise.empresa} - ${cruise.nombreBarco}`
                        : `Crucero ${idx + 1}`
                      }
                    </div>
                  )}
                  <div className="space-y-2">
                    {cruise.destino && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Destino:</span> {cruise.destino}
                      </div>
                    )}
                    {cruise.fechaPartida && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Fecha de partida:</span> {formatDate(cruise.fechaPartida)}
                      </div>
                    )}
                    {cruise.fechaRegreso && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Fecha de regreso:</span> {formatDate(cruise.fechaRegreso)}
                      </div>
                    )}
                    {cruise.tipoCabina && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Tipo de cabina:</span> {cruise.tipoCabina}
                      </div>
                    )}
                    {cruise.cantidadDias && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Duración:</span> {cruise.cantidadDias} días
                      </div>
                    )}
                    {cruise.mostrarPrecio && cruise.precio && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Precio:</span> {getCurrencySymbol(cruise.useCustomCurrency ? cruise.currency : formData.selectedCurrency)} {cruise.precio}
                      </div>
                    )}
                    {cruise.textoLibre && (
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Comentarios adicionales:</span> <span className="italic text-gray-600 font-normal">{cruise.textoLibre}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {hasTotales && (
        <div className="border-l-4 border-green-500 pl-3">
          <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Calculator className="h-4 w-4 text-green-600" />
            Resumen del total
          </h4>
          <div className="space-y-2">
            {Object.entries(allTotals).map(([currency, amount]) => (
              <div key={currency} className="text-sm text-gray-700 font-semibold">
                Total: {currency} {amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 