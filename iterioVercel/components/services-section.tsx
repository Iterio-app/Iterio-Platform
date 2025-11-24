"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Ticket } from "lucide-react"
import MultiImageUpload from "./multi-image-upload"
import { Checkbox } from "@/components/ui/checkbox"

interface Service {
  id: string
  nombre: string
  descripcion: string
  fecha: string
  duracion: string
  precio: string
  imagenes: string[]
  mostrarPrecio: boolean
  useCustomCurrency?: boolean // nuevo
  currency?: string // nuevo
}

interface ServicesSectionProps {
  services: Service[]
  onChange: (services: Service[]) => void
  selectedCurrency: string // nuevo
}

export default function ServicesSection({ services, onChange, selectedCurrency }: ServicesSectionProps) {
  const updateService = (id: string, field: keyof Service, value: string | string[] | boolean) => {
    onChange(services.map((service) => (service.id === id ? { ...service, [field]: value } : service)))
  }

  const addService = () => {
    const newService: Service = {
      id: Date.now().toString(),
      nombre: "",
      descripcion: "",
      fecha: "",
      duracion: "",
      precio: "",
      imagenes: [],
      mostrarPrecio: true,
      useCustomCurrency: false,
      currency: selectedCurrency,
    }
    onChange([...services, newService])
  }

  const removeService = (id: string) => {
    onChange(services.filter((service) => service.id !== id))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5" />
          Servicios Adicionales
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {services.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay servicios adicionales agregados</p>
            <p className="text-sm">Haz clic en "Agregar servicio" para comenzar</p>
          </div>
        ) : (
          services.map((service, index) => (
            <div key={service.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Servicio {index + 1}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeService(service.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`nombre-${service.id}`}>Nombre del servicio</Label>
                <Input
                  id={`nombre-${service.id}`}
                  value={service.nombre}
                  onChange={(e) => updateService(service.id, "nombre", e.target.value)}
                  placeholder="Ej: Tour guiado, Seguro de viaje"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`descripcion-${service.id}`}>Descripción</Label>
                <Textarea
                  id={`descripcion-${service.id}`}
                  value={service.descripcion}
                  onChange={(e) => updateService(service.id, "descripcion", e.target.value)}
                  placeholder="Descripción detallada del servicio"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`fecha-${service.id}`}>Fecha (opcional)</Label>
                  <Input
                    id={`fecha-${service.id}`}
                    type="date"
                    value={service.fecha}
                    onChange={(e) => updateService(service.id, "fecha", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`duracion-${service.id}`}>Duración (opcional)</Label>
                  <Input
                    id={`duracion-${service.id}`}
                    value={service.duracion}
                    onChange={(e) => updateService(service.id, "duracion", e.target.value)}
                    placeholder="Ej: 2 horas, Todo el día"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    id={`useCustomCurrency-${service.id}`}
                    type="checkbox"
                    checked={service.useCustomCurrency || false}
                    onChange={(e) => updateService(service.id, "useCustomCurrency", e.target.checked)}
                    className="accent-blue-600 h-4 w-4"
                  />
                  <Label htmlFor={`useCustomCurrency-${service.id}`}>Usar moneda personalizada para este servicio</Label>
                  {service.useCustomCurrency && (
                    <select
                      value={service.currency || selectedCurrency}
                      onChange={e => updateService(service.id, "currency", e.target.value)}
                      className="ml-2 border rounded px-2 py-1"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="ARS">ARS</option>
                    </select>
                  )}
                  {!service.useCustomCurrency && (
                    <span className="ml-2 text-xs text-gray-500">(actualmente {selectedCurrency})</span>
                  )}
                </div>
                <Label htmlFor={`precio-${service.id}`}>Precio</Label>
                <Input
                  id={`precio-${service.id}`}
                  value={service.precio}
                  onChange={(e) => updateService(service.id, "precio", e.target.value)}
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0"
                />
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
              </div>

              <MultiImageUpload
                id={`imagenes-servicio-${service.id}`}
                label="Imágenes del servicio"
                images={service.imagenes}
                onImagesChange={(images) => updateService(service.id, "imagenes", images)}
                maxImages={6}
              />
            </div>
          ))
        )}

        <Button onClick={addService} className="w-full" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Agregar servicio
        </Button>
      </CardContent>
    </Card>
  )
}
