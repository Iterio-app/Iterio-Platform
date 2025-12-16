"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plane, Plus, Trash2, ChevronDown, ChevronUp, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import MultiImageUpload from "./multi-image-upload"
import { useState } from "react"

interface Flight {
  id: string
  nombre: string
  fechaSalida?: string
  fechaRetorno?: string
  imagenes: string[]
  tipoTarifa: "economy" | "premium_economy" | "business" | "primera_clase" | ""
  // Precios por adulto
  precioAdultoMochila: string
  precioAdultoMochilaCarryOn: string
  precioAdultoMochilaBodega: string
  precioAdultoMochilaCarryOnBodega: string
  mostrarPrecioAdultoMochila: boolean
  mostrarPrecioAdultoMochilaCarryOn: boolean
  mostrarPrecioAdultoMochilaBodega: boolean
  mostrarPrecioAdultoMochilaCarryOnBodega: boolean
  // Precios por menor
  precioMenorMochila: string
  precioMenorMochilaCarryOn: string
  precioMenorMochilaBodega: string
  precioMenorMochilaCarryOnBodega: string
  mostrarPrecioMenorMochila: boolean
  mostrarPrecioMenorMochilaCarryOn: boolean
  mostrarPrecioMenorMochilaBodega: boolean
  mostrarPrecioMenorMochilaCarryOnBodega: boolean
  // Precio por infante (tarifa única)
  precioInfante: string
  mostrarPrecioInfante: boolean
  condicionesTarifa: string[]
  requisitosMigratorios: string[]
  textoLibre: string
  destino?: string
  useCustomCurrency?: boolean
  currency?: string
  // Campos legacy para compatibilidad con cotizaciones antiguas
  precioAdultoMochilaCarryOnValija?: string
  precioMenorMochilaCarryOnValija?: string
  mostrarPrecioAdultoMochilaCarryOnValija?: boolean
  mostrarPrecioMenorMochilaCarryOnValija?: boolean
}

interface FlightsSectionProps {
  flights: Flight[]
  onChange: (flights: Flight[]) => void
  clientData: {
    cantidadAdultos: number
    cantidadMenores: number
    cantidadInfantes: number
  }
  selectedCurrency: string // nueva prop
}

const tiposTarifa = [
  { value: "economy", label: "Economy" },
  { value: "premium_economy", label: "Premium Economy" },
  { value: "business", label: "Business" },
  { value: "primera_clase", label: "Primera Clase" },
]

const condicionesTarifaOptions = [
  "NO permite devolución",
  "SI permite cambios (abonando penalidad y diferencia de tarifa)",
  "NO permite cambios",
  "NO permite cambio de ruta",
]

const requisitosMigratoriosOptions = [
  "VISA",
  "ETA",
  "Vacunas",
  "Vigencia del pasaporte de al menos 6 meses previos al viaje",
  "Autorización para viajar con menor",
]

export default function FlightsSection({ flights, onChange, clientData, selectedCurrency }: FlightsSectionProps) {
  const [expandedConditions, setExpandedConditions] = useState<{ [key: string]: boolean }>({})
  const [expandedRequirements, setExpandedRequirements] = useState<{ [key: string]: boolean }>({})

  const addFlight = () => {
    const newFlight: Flight = {
      id: Date.now().toString(),
      nombre: "",
      fechaSalida: "",
      fechaRetorno: "",
      imagenes: [],
      tipoTarifa: "",
      // Adultos
      precioAdultoMochila: "",
      precioAdultoMochilaCarryOn: "",
      precioAdultoMochilaBodega: "",
      precioAdultoMochilaCarryOnBodega: "",
      mostrarPrecioAdultoMochila: true,
      mostrarPrecioAdultoMochilaCarryOn: true,
      mostrarPrecioAdultoMochilaBodega: true,
      mostrarPrecioAdultoMochilaCarryOnBodega: true,
      // Menores
      precioMenorMochila: "",
      precioMenorMochilaCarryOn: "",
      precioMenorMochilaBodega: "",
      precioMenorMochilaCarryOnBodega: "",
      mostrarPrecioMenorMochila: true,
      mostrarPrecioMenorMochilaCarryOn: true,
      mostrarPrecioMenorMochilaBodega: true,
      mostrarPrecioMenorMochilaCarryOnBodega: true,
      // Infantes
      precioInfante: "",
      mostrarPrecioInfante: true,
      condicionesTarifa: [],
      requisitosMigratorios: [],
      textoLibre: "",
      useCustomCurrency: false,
      currency: selectedCurrency,
    }
    onChange([...flights, newFlight])
  }

  const removeFlight = (id: string) => {
    onChange(flights.filter((flight) => flight.id !== id))
  }

  const updateFlight = (id: string, field: keyof Flight, value: any) => {
    onChange(flights.map((flight) => (flight.id === id ? { ...flight, [field]: value } : flight)))
  }

  const toggleCondicionTarifa = (flightId: string, condicion: string) => {
    const flight = flights.find((f) => f.id === flightId)
    if (!flight) return

    const newCondiciones = flight.condicionesTarifa.includes(condicion)
      ? flight.condicionesTarifa.filter((c) => c !== condicion)
      : [...flight.condicionesTarifa, condicion]

    updateFlight(flightId, "condicionesTarifa", newCondiciones)
  }

  const toggleRequisitoMigratorio = (flightId: string, requisito: string) => {
    const flight = flights.find((f) => f.id === flightId)
    if (!flight) return

    const newRequisitos = flight.requisitosMigratorios.includes(requisito)
      ? flight.requisitosMigratorios.filter((r) => r !== requisito)
      : [...flight.requisitosMigratorios, requisito]

    updateFlight(flightId, "requisitosMigratorios", newRequisitos)
  }

  const toggleExpandConditions = (flightId: string) => {
    setExpandedConditions((prev) => ({
      ...prev,
      [flightId]: !prev[flightId],
    }))
  }

  const toggleExpandRequirements = (flightId: string) => {
    setExpandedRequirements((prev) => ({
      ...prev,
      [flightId]: !prev[flightId],
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plane className="h-5 w-5" />
          Vuelos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {flights.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Plane className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay vuelos agregados</p>
            <p className="text-sm">Haz clic en "Agregar vuelo" para comenzar</p>
          </div>
        ) : (
          flights.map((flight, index) => (
            <div key={flight.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Vuelo {index + 1}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFlight(flight.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {/* Switch y selector de moneda personalizada */}
              <div className="flex items-center gap-2 mb-2">
                <input
                  id={`useCustomCurrency-${flight.id}`}
                  type="checkbox"
                  checked={flight.useCustomCurrency || false}
                  onChange={(e) => updateFlight(flight.id, "useCustomCurrency", e.target.checked)}
                  className="accent-blue-600 h-4 w-4"
                />
                <Label htmlFor={`useCustomCurrency-${flight.id}`}>Usar moneda personalizada para este vuelo</Label>
                {flight.useCustomCurrency && (
                  <select
                    value={flight.currency || selectedCurrency}
                    onChange={e => updateFlight(flight.id, "currency", e.target.value)}
                    className="ml-2 border rounded px-2 py-1"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="ARS">ARS</option>
                  </select>
                )}
                {!flight.useCustomCurrency && (
                  <span className="ml-2 text-xs text-gray-500">(actualmente {selectedCurrency})</span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`nombre-${flight.id}`}>Nombre de Compañía Aérea</Label>
                <Input
                  id={`nombre-${flight.id}`}
                  value={flight.nombre}
                  onChange={(e) => updateFlight(flight.id, "nombre", e.target.value)}
                  placeholder="Ej: Aerolíneas Argentinas, LATAM, Iberia"
                />
              </div>

              {index > 0 && (
                <div className="space-y-2">
                  <Label htmlFor={`destino-${flight.id}`}>Destino de este vuelo</Label>
                  <Input
                    id={`destino-${flight.id}`}
                    value={flight.destino || ""}
                    onChange={(e) => updateFlight(flight.id, "destino", e.target.value)}
                    placeholder="Ej: Santiago, Chile"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`fechaSalida-${flight.id}`}>Fecha de salida</Label>
                  <Input
                    id={`fechaSalida-${flight.id}`}
                    type="date"
                    value={flight.fechaSalida || ""}
                    onChange={(e) => updateFlight(flight.id, "fechaSalida", e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`fechaRetorno-${flight.id}`}>Fecha de retorno</Label>
                  <Input
                    id={`fechaRetorno-${flight.id}`}
                    type="date"
                    value={flight.fechaRetorno || ""}
                    onChange={(e) => updateFlight(flight.id, "fechaRetorno", e.target.value)}
                    min={flight.fechaSalida ? flight.fechaSalida : new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              {/* Validación de fechas */}
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

              <MultiImageUpload
                id={`imagenes-vuelo-${flight.id}`}
                label="Imágenes del vuelo"
                images={flight.imagenes}
                onImagesChange={(images) => updateFlight(flight.id, "imagenes", images)}
                maxImages={6}
              />

              {/* Tipo de Tarifa */}
              <div className="space-y-2">
                <Label htmlFor={`tipoTarifa-${flight.id}`}>Tipo de Tarifa</Label>
                <Select
                  value={flight.tipoTarifa}
                  onValueChange={(value) => updateFlight(flight.id, "tipoTarifa", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo de tarifa" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposTarifa.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label>Precios por tipo de pasajero</Label>

                <div className="grid gap-4">
                  {/* Adultos */}
                  {clientData.cantidadAdultos > 0 && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-blue-600 mb-3">Adultos ({clientData.cantidadAdultos})</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              id={`mostrarAdultoMochila-${flight.id}`}
                              type="checkbox"
                              checked={flight.mostrarPrecioAdultoMochila}
                              onChange={(e) =>
                                updateFlight(flight.id, "mostrarPrecioAdultoMochila", e.target.checked)
                              }
                              className="accent-blue-600 h-4 w-4"
                            />
                            <Label htmlFor={`mostrarAdultoMochila-${flight.id}`} className="text-sm">
                              Mostrar en PDF
                            </Label>
                          </div>
                          <Label htmlFor={`precioAdultoMochila-${flight.id}`}>Solo mochila</Label>
                          <Input
                            id={`precioAdultoMochila-${flight.id}`}
                            value={flight.precioAdultoMochila}
                            onChange={(e) => updateFlight(flight.id, "precioAdultoMochila", e.target.value)}
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            min="0"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              id={`mostrarAdultoMochilaCarryOn-${flight.id}`}
                              type="checkbox"
                              checked={flight.mostrarPrecioAdultoMochilaCarryOn}
                              onChange={(e) =>
                                updateFlight(flight.id, "mostrarPrecioAdultoMochilaCarryOn", e.target.checked)
                              }
                              className="accent-blue-600 h-4 w-4"
                            />
                            <Label htmlFor={`mostrarAdultoMochilaCarryOn-${flight.id}`} className="text-sm">
                              Mostrar en PDF
                            </Label>
                          </div>
                          <Label htmlFor={`precioAdultoMochilaCarryOn-${flight.id}`}>Mochila + Carry On</Label>
                          <Input
                            id={`precioAdultoMochilaCarryOn-${flight.id}`}
                            value={flight.precioAdultoMochilaCarryOn}
                            onChange={(e) => updateFlight(flight.id, "precioAdultoMochilaCarryOn", e.target.value)}
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            min="0"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              id={`mostrarAdultoMochilaBodega-${flight.id}`}
                              type="checkbox"
                              checked={flight.mostrarPrecioAdultoMochilaBodega}
                              onChange={(e) =>
                                updateFlight(flight.id, "mostrarPrecioAdultoMochilaBodega", e.target.checked)
                              }
                              className="accent-blue-600 h-4 w-4"
                            />
                            <Label htmlFor={`mostrarAdultoMochilaBodega-${flight.id}`} className="text-sm">
                              Mostrar en PDF
                            </Label>
                          </div>
                          <Label htmlFor={`precioAdultoMochilaBodega-${flight.id}`}>Mochila + Bodega</Label>
                          <Input
                            id={`precioAdultoMochilaBodega-${flight.id}`}
                            value={flight.precioAdultoMochilaBodega}
                            onChange={(e) => updateFlight(flight.id, "precioAdultoMochilaBodega", e.target.value)}
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            min="0"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              id={`mostrarAdultoMochilaCarryOnBodega-${flight.id}`}
                              type="checkbox"
                              checked={flight.mostrarPrecioAdultoMochilaCarryOnBodega}
                              onChange={(e) =>
                                updateFlight(flight.id, "mostrarPrecioAdultoMochilaCarryOnBodega", e.target.checked)
                              }
                              className="accent-blue-600 h-4 w-4"
                            />
                            <Label htmlFor={`mostrarAdultoMochilaCarryOnBodega-${flight.id}`} className="text-sm">
                              Mostrar en PDF
                            </Label>
                          </div>
                          <Label htmlFor={`precioAdultoMochilaCarryOnBodega-${flight.id}`}>
                            Mochila + Carry On + Bodega
                          </Label>
                          <Input
                            id={`precioAdultoMochilaCarryOnBodega-${flight.id}`}
                            value={flight.precioAdultoMochilaCarryOnBodega}
                            onChange={(e) =>
                              updateFlight(flight.id, "precioAdultoMochilaCarryOnBodega", e.target.value)
                            }
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Menores */}
                  {clientData.cantidadMenores > 0 && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-green-600 mb-3">Menores ({clientData.cantidadMenores})</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              id={`mostrarMenorMochila-${flight.id}`}
                              type="checkbox"
                              checked={flight.mostrarPrecioMenorMochila}
                              onChange={(e) =>
                                updateFlight(flight.id, "mostrarPrecioMenorMochila", e.target.checked)
                              }
                              className="accent-blue-600 h-4 w-4"
                            />
                            <Label htmlFor={`mostrarMenorMochila-${flight.id}`} className="text-sm">
                              Mostrar en PDF
                            </Label>
                          </div>
                          <Label htmlFor={`precioMenorMochila-${flight.id}`}>Solo mochila</Label>
                          <Input
                            id={`precioMenorMochila-${flight.id}`}
                            value={flight.precioMenorMochila}
                            onChange={(e) => updateFlight(flight.id, "precioMenorMochila", e.target.value)}
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            min="0"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              id={`mostrarMenorMochilaCarryOn-${flight.id}`}
                              type="checkbox"
                              checked={flight.mostrarPrecioMenorMochilaCarryOn}
                              onChange={(e) =>
                                updateFlight(flight.id, "mostrarPrecioMenorMochilaCarryOn", e.target.checked)
                              }
                              className="accent-blue-600 h-4 w-4"
                            />
                            <Label htmlFor={`mostrarMenorMochilaCarryOn-${flight.id}`} className="text-sm">
                              Mostrar en PDF
                            </Label>
                          </div>
                          <Label htmlFor={`precioMenorMochilaCarryOn-${flight.id}`}>Mochila + Carry On</Label>
                          <Input
                            id={`precioMenorMochilaCarryOn-${flight.id}`}
                            value={flight.precioMenorMochilaCarryOn}
                            onChange={(e) => updateFlight(flight.id, "precioMenorMochilaCarryOn", e.target.value)}
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            min="0"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              id={`mostrarMenorMochilaBodega-${flight.id}`}
                              type="checkbox"
                              checked={flight.mostrarPrecioMenorMochilaBodega}
                              onChange={(e) =>
                                updateFlight(flight.id, "mostrarPrecioMenorMochilaBodega", e.target.checked)
                              }
                              className="accent-blue-600 h-4 w-4"
                            />
                            <Label htmlFor={`mostrarMenorMochilaBodega-${flight.id}`} className="text-sm">
                              Mostrar en PDF
                            </Label>
                          </div>
                          <Label htmlFor={`precioMenorMochilaBodega-${flight.id}`}>Mochila + Bodega</Label>
                          <Input
                            id={`precioMenorMochilaBodega-${flight.id}`}
                            value={flight.precioMenorMochilaBodega}
                            onChange={(e) => updateFlight(flight.id, "precioMenorMochilaBodega", e.target.value)}
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            min="0"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              id={`mostrarMenorMochilaCarryOnBodega-${flight.id}`}
                              type="checkbox"
                              checked={flight.mostrarPrecioMenorMochilaCarryOnBodega}
                              onChange={(e) =>
                                updateFlight(flight.id, "mostrarPrecioMenorMochilaCarryOnBodega", e.target.checked)
                              }
                              className="accent-blue-600 h-4 w-4"
                            />
                            <Label htmlFor={`mostrarMenorMochilaCarryOnBodega-${flight.id}`} className="text-sm">
                              Mostrar en PDF
                            </Label>
                          </div>
                          <Label htmlFor={`precioMenorMochilaCarryOnBodega-${flight.id}`}>
                            Mochila + Carry On + Bodega
                          </Label>
                          <Input
                            id={`precioMenorMochilaCarryOnBodega-${flight.id}`}
                            value={flight.precioMenorMochilaCarryOnBodega}
                            onChange={(e) => updateFlight(flight.id, "precioMenorMochilaCarryOnBodega", e.target.value)}
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Infantes */}
                  {clientData.cantidadInfantes > 0 && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-purple-600 mb-3">Infantes ({clientData.cantidadInfantes})</h4>
                      <div className="max-w-md">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              id={`mostrarInfante-${flight.id}`}
                              type="checkbox"
                              checked={flight.mostrarPrecioInfante}
                              onChange={(e) => updateFlight(flight.id, "mostrarPrecioInfante", e.target.checked)}
                              className="accent-blue-600 h-4 w-4"
                            />
                            <Label htmlFor={`mostrarInfante-${flight.id}`} className="text-sm">
                              Mostrar en PDF
                            </Label>
                          </div>
                          <Label htmlFor={`precioInfante-${flight.id}`}>Tarifa única</Label>
                          <Input
                            id={`precioInfante-${flight.id}`}
                            value={flight.precioInfante}
                            onChange={(e) => updateFlight(flight.id, "precioInfante", e.target.value)}
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Condiciones de Tarifa - Desplegable */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => toggleExpandConditions(flight.id)}
                  className="w-full justify-between"
                  type="button"
                >
                  <span>
                    Condiciones de tarifa aérea
                    {flight.condicionesTarifa.length > 0 && (
                      <span className="ml-2 text-sm text-blue-600">
                        ({flight.condicionesTarifa.length} seleccionadas)
                      </span>
                    )}
                  </span>
                  {expandedConditions[flight.id] ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>

                {expandedConditions[flight.id] && (
                  <div className="border rounded-md p-3 bg-gray-50">
                    <div className="grid grid-cols-1 gap-2">
                      {condicionesTarifaOptions.map((condicion) => (
                        <div key={condicion} className="flex items-center space-x-2">
                          <input
                            id={`condicion-${flight.id}-${condicion}`}
                            type="checkbox"
                            checked={flight.condicionesTarifa.includes(condicion)}
                            onChange={() => toggleCondicionTarifa(flight.id, condicion)}
                            className="accent-blue-600 h-4 w-4"
                          />
                          <Label htmlFor={`condicion-${flight.id}-${condicion}`} className="text-sm">
                            {condicion}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Requisitos Migratorios - Desplegable */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => toggleExpandRequirements(flight.id)}
                  className="w-full justify-between"
                  type="button"
                >
                  <span>
                    Requisitos migratorios
                    {flight.requisitosMigratorios.length > 0 && (
                      <span className="ml-2 text-sm text-blue-600">
                        ({flight.requisitosMigratorios.length} seleccionados)
                      </span>
                    )}
                  </span>
                  {expandedRequirements[flight.id] ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>

                {expandedRequirements[flight.id] && (
                  <div className="border rounded-md p-3 bg-gray-50">
                    <div className="grid grid-cols-1 gap-2">
                      {requisitosMigratoriosOptions.map((requisito) => (
                        <div key={requisito} className="flex items-center space-x-2">
                          <input
                            id={`requisito-${flight.id}-${requisito}`}
                            type="checkbox"
                            checked={flight.requisitosMigratorios.includes(requisito)}
                            onChange={() => toggleRequisitoMigratorio(flight.id, requisito)}
                            className="accent-blue-600 h-4 w-4"
                          />
                          <Label htmlFor={`requisito-${flight.id}-${requisito}`} className="text-sm">
                            {requisito}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`textoLibre-${flight.id}`}>Comentarios adicionales</Label>
                <Textarea
                  id={`textoLibre-${flight.id}`}
                  value={flight.textoLibre}
                  onChange={(e) => updateFlight(flight.id, "textoLibre", e.target.value)}
                  placeholder="Información adicional sobre el vuelo..."
                  rows={3}
                />
              </div>
            </div>
          ))
        )}

        <Button onClick={addFlight} className="w-full" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Agregar vuelo
        </Button>
      </CardContent>
    </Card>
  )
}
