"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, Plus, Trash2, AlertCircle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import MultiImageUpload from "./multi-image-upload"

interface RoomOption {
  id: string
  tipoHabitacion: string
  regimen: "sin_desayuno" | "desayuno" | "media_pension" | "pension_completa" | "all_inclusive"
  precio: string
  regimenTouched?: boolean
}

interface Accommodation {
  id: string
  nombre: string
  ciudad: string
  imagenes: string[]
  checkin: string
  checkout: string
  cantidadHabitaciones: number
  habitaciones: RoomOption[]
  precioTotal: number
  textoLibre: string
  mostrarPrecio: boolean
  cantidadNoches: number
  useCustomCurrency?: boolean // nuevo
  currency?: string // nuevo
}

interface AccommodationSectionProps {
  accommodations: Accommodation[]
  onChange: (accommodations: Accommodation[]) => void
  selectedCurrency: string // nuevo
}

const regimenOptions = [
  { value: "sin_desayuno", label: "Sin desayuno" },
  { value: "desayuno", label: "Desayuno" },
  { value: "media_pension", label: "Media pensión" },
  { value: "pension_completa", label: "Pensión completa" },
  { value: "all_inclusive", label: "All inclusive" },
]

export default function AccommodationSection({ accommodations, onChange, selectedCurrency }: AccommodationSectionProps) {
  const addAccommodation = () => {
    const newAccommodation: Accommodation = {
      id: Date.now().toString(),
      nombre: "",
      ciudad: "",
      imagenes: [],
      checkin: "",
      checkout: "",
      cantidadHabitaciones: 1,
      habitaciones: [
        {
          id: "1",
          tipoHabitacion: "",
          regimen: "sin_desayuno",
          precio: "",
        },
      ],
      precioTotal: 0,
      textoLibre: "",
      mostrarPrecio: true,
      cantidadNoches: 1,
      useCustomCurrency: false,
      currency: selectedCurrency,
    }
    onChange([...accommodations, newAccommodation])
  }

  const removeAccommodation = (id: string) => {
    onChange(accommodations.filter((accommodation) => accommodation.id !== id))
  }

  const updateAccommodation = (
    id: string,
    field: keyof Accommodation,
    value: string | boolean | string[] | number | RoomOption[],
  ) => {
    onChange(
      accommodations.map((accommodation) => {
        if (accommodation.id === id) {
          const updated = { ...accommodation, [field]: value }

          // Recalcular precio total cuando cambian las habitaciones
          if (field === "habitaciones") {
            const precioBase = (value as RoomOption[]).reduce(
              (sum, room) => sum + (Number.parseFloat(room.precio) || 0),
              0,
            )
            updated.precioTotal = precioBase * (updated.cantidadNoches || 1)
          }

          // Recalcular precio total cuando cambia la cantidad de noches
          if (field === "cantidadNoches") {
            const precioBase = updated.habitaciones.reduce(
              (sum, room) => sum + (Number.parseFloat(room.precio) || 0),
              0,
            )
            updated.precioTotal = precioBase * (value as number)
          }

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

          return updated
        }
        return accommodation
      }),
    )
  }

  const updateCantidadHabitaciones = (accommodationId: string, cantidad: number) => {
    const accommodation = accommodations.find((acc) => acc.id === accommodationId)
    if (!accommodation) return

    const newHabitaciones: RoomOption[] = []

    // Mantener habitaciones existentes o crear nuevas
    for (let i = 0; i < cantidad; i++) {
      if (i < accommodation.habitaciones.length) {
        newHabitaciones.push(accommodation.habitaciones[i])
      } else {
        newHabitaciones.push({
          id: (i + 1).toString(),
          tipoHabitacion: "",
          regimen: "sin_desayuno",
          precio: "",
        })
      }
    }

    const precioBase = newHabitaciones.reduce((sum, room) => sum + (Number.parseFloat(room.precio) || 0), 0)
    const precioTotal = precioBase * (accommodation.cantidadNoches || 1)

    // Actualizar todo en una sola operación
    onChange(
      accommodations.map((acc) =>
        acc.id === accommodationId
          ? {
              ...acc,
              cantidadHabitaciones: cantidad,
              habitaciones: newHabitaciones,
              precioTotal: precioTotal,
            }
          : acc,
      ),
    )
  }

  const updateHabitacion = (
    accommodationId: string,
    roomId: string,
    fields: Partial<Omit<RoomOption, 'regimen'> & { regimen?: RoomOption['regimen'] }>
  ) => {
    onChange(
      accommodations.map((acc) => {
        if (acc.id === accommodationId) {
          const updatedHabitaciones = acc.habitaciones.map((room) =>
            room.id === roomId ? { ...room, ...fields } : room,
          )

          const precioBase = updatedHabitaciones.reduce((sum, room) => sum + (Number.parseFloat(room.precio) || 0), 0)
          const precioTotal = precioBase * (acc.cantidadNoches || 1)

          return {
            ...acc,
            habitaciones: updatedHabitaciones,
            precioTotal: precioTotal,
          }
        }
        return acc
      }),
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Alojamiento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {accommodations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay alojamientos agregados</p>
            <p className="text-sm">Haz clic en "Agregar alojamiento" para comenzar</p>
          </div>
        ) : (
          accommodations.map((accommodation, index) => (
            <div key={accommodation.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Alojamiento {index + 1}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAccommodation(accommodation.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`nombre-${accommodation.id}`}>Nombre del alojamiento</Label>
                  <Input
                    id={`nombre-${accommodation.id}`}
                    value={accommodation.nombre}
                    onChange={(e) => updateAccommodation(accommodation.id, "nombre", e.target.value)}
                    placeholder="Ej: Hotel Marriott Madrid"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`ciudad-${accommodation.id}`}>Ciudad</Label>
                  <Input
                    id={`ciudad-${accommodation.id}`}
                    value={accommodation.ciudad || ""}
                    onChange={(e) => updateAccommodation(accommodation.id, "ciudad", e.target.value)}
                    placeholder="Ej: Madrid, Barcelona"
                  />
                </div>
              </div>

              <MultiImageUpload
                id={`imagenes-alojamiento-${accommodation.id}`}
                label="Imágenes del alojamiento"
                images={accommodation.imagenes}
                onImagesChange={(images) => updateAccommodation(accommodation.id, "imagenes", images)}
                maxImages={4}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`checkin-${accommodation.id}`}>Check-in</Label>
                  <Input
                    id={`checkin-${accommodation.id}`}
                    type="date"
                    value={accommodation.checkin}
                    onChange={(e) => updateAccommodation(accommodation.id, "checkin", e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`checkout-${accommodation.id}`}>Check-out</Label>
                  <Input
                    id={`checkout-${accommodation.id}`}
                    type="date"
                    value={accommodation.checkout}
                    onChange={(e) => updateAccommodation(accommodation.id, "checkout", e.target.value)}
                    min={accommodation.checkin ? new Date(accommodation.checkin).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              {/* Validación de fechas */}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`cantidadHabitaciones-${accommodation.id}`}>Cantidad de habitaciones</Label>
                  <Select
                    value={accommodation.cantidadHabitaciones.toString()}
                    onValueChange={(value) => updateCantidadHabitaciones(accommodation.id, parseInt(value))}
                  >
                    <SelectTrigger id={`cantidadHabitaciones-${accommodation.id}`}>
                      <SelectValue placeholder="1" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`cantidadNoches-${accommodation.id}`}>Cantidad de noches</Label>
                  <Input
                    id={`cantidadNoches-${accommodation.id}`}
                    type="number"
                    min="1"
                    value={accommodation.cantidadNoches}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      updateAccommodation(accommodation.id, "cantidadNoches", Math.max(1, value));
                    }}
                    className={accommodation.checkin && accommodation.checkout && new Date(accommodation.checkin) >= new Date(accommodation.checkout) ? "border-red-300 bg-red-50" : ""}
                  />
                  <p className="text-xs text-gray-500">
                    Se calcula automáticamente según las fechas.
                  </p>
                  {accommodation.checkin && accommodation.checkout && new Date(accommodation.checkin) >= new Date(accommodation.checkout) && (
                    <p className="text-xs text-red-600">
                      ⚠️ No se puede calcular automáticamente con fechas inválidas.
                    </p>
                  )}
                </div>
              </div>

              {/* Configuración de habitaciones */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Configuración de habitaciones</Label>
                {accommodation.habitaciones.map((habitacion, roomIndex) => (
                  <div key={habitacion.id} className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium text-blue-600 mb-3">Habitación {roomIndex + 1}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`tipoHabitacion-${accommodation.id}-${habitacion.id}`}>Tipo de habitación</Label>
                        <Input
                          id={`tipoHabitacion-${accommodation.id}-${habitacion.id}`}
                          value={habitacion.tipoHabitacion}
                          onChange={(e) =>
                            updateHabitacion(accommodation.id, habitacion.id, { tipoHabitacion: e.target.value })
                          }
                          placeholder="Ej: Doble estándar, Suite"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`regimen-${accommodation.id}-${habitacion.id}`}>Régimen de comidas</Label>
                        <Select
                          value={habitacion.regimen}
                          onValueChange={(value: RoomOption["regimen"]) => {
                            updateHabitacion(accommodation.id, habitacion.id, { regimen: value, regimenTouched: true });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar régimen" />
                          </SelectTrigger>
                          <SelectContent>
                            {regimenOptions.map((regimen) => (
                              <SelectItem key={regimen.value} value={regimen.value}>
                                {regimen.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`precio-${accommodation.id}-${habitacion.id}`}>Precio por noche</Label>
                        <Input
                          id={`precio-${accommodation.id}-${habitacion.id}`}
                          value={habitacion.precio}
                          onChange={(e) => updateHabitacion(accommodation.id, habitacion.id, { precio: e.target.value })}
                          placeholder="0.00"
                          type="number"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>
                    {habitacion.regimen === "sin_desayuno" && !habitacion.regimenTouched && (
                      <div className="text-xs text-gray-500 mt-3">
                        Si el régimen de desayuno es "Sin desayuno" debe seleccionar otro y luego volver a "Sin desayuno" para que desaparezca la alerta en el Panel de Asistencia.
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Precio total */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      id={`mostrarPrecio-${accommodation.id}`}
                      type="checkbox"
                      checked={accommodation.mostrarPrecio}
                      onChange={e => updateAccommodation(accommodation.id, "mostrarPrecio", e.target.checked)}
                      className="accent-blue-600 h-4 w-4"
                    />
                    <Label htmlFor={`mostrarPrecio-${accommodation.id}`} className="text-sm">
                      Mostrar precio en el PDF
                    </Label>
                  </div>
                  <div className="text-right">
                    <Label className="text-sm font-medium text-blue-700">
                      Precio total por {accommodation.cantidadHabitaciones} habitaci{accommodation.cantidadHabitaciones > 1 ? "ones" : "ón"} por {accommodation.cantidadNoches} noche{accommodation.cantidadNoches > 1 ? "s" : ""}
                    </Label>
                    <div className="text-lg font-bold text-blue-800">
                      {(accommodation.currency || selectedCurrency)} {accommodation.precioTotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    id={`useCustomCurrency-${accommodation.id}`}
                    type="checkbox"
                    checked={accommodation.useCustomCurrency || false}
                    onChange={(e) => updateAccommodation(accommodation.id, "useCustomCurrency", e.target.checked)}
                    className="accent-blue-600 h-4 w-4"
                  />
                  <Label htmlFor={`useCustomCurrency-${accommodation.id}`}>Usar moneda personalizada para este alojamiento</Label>
                  {accommodation.useCustomCurrency && (
                    <select
                      value={accommodation.currency || selectedCurrency}
                      onChange={e => updateAccommodation(accommodation.id, "currency", e.target.value)}
                      className="ml-2 border rounded px-2 py-1"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="ARS">ARS</option>
                    </select>
                  )}
                  {!accommodation.useCustomCurrency && (
                    <span className="ml-2 text-xs text-gray-500">(actualmente {selectedCurrency})</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`textoLibre-${accommodation.id}`}>Comentarios adicionales</Label>
                <Textarea
                  id={`textoLibre-${accommodation.id}`}
                  value={accommodation.textoLibre}
                  onChange={(e) => updateAccommodation(accommodation.id, "textoLibre", e.target.value)}
                  placeholder="Información adicional sobre el alojamiento..."
                  rows={3}
                />
              </div>
            </div>
          ))
        )}

        <Button onClick={addAccommodation} className="w-full" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Agregar alojamiento
        </Button>
      </CardContent>
    </Card>
  )
}
