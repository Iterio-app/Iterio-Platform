"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, Plus, Trash2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import MultiImageUpload from "./multi-image-upload"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Transfer {
  id: string
  nombre: string
  origen: string
  destino: string
  tipoTraslado: string
  fecha: string
  hora: string
  precio: string
  imagenes: string[]
  textoLibre: string
  mostrarPrecio: boolean
  useCustomCurrency?: boolean // nuevo
  currency?: string // nuevo
}

interface TransfersSectionProps {
  transfers: Transfer[]
  onChange: (transfers: Transfer[]) => void
  selectedCurrency: string // nuevo
}

export default function TransfersSection({ transfers, onChange, selectedCurrency }: TransfersSectionProps) {
  const addTransfer = () => {
    const newTransfer: Transfer = {
      id: Date.now().toString(),
      nombre: "",
      origen: "",
      destino: "",
      tipoTraslado: "",
      fecha: "",
      hora: "",
      precio: "",
      imagenes: [],
      textoLibre: "",
      mostrarPrecio: true,
      useCustomCurrency: false,
      currency: selectedCurrency,
    }
    onChange([...transfers, newTransfer])
  }

  const removeTransfer = (id: string) => {
    onChange(transfers.filter((transfer) => transfer.id !== id))
  }

  const updateTransfer = (id: string, field: keyof Transfer, value: any) => {
    onChange(transfers.map((transfer) => (transfer.id === id ? { ...transfer, [field]: value } : transfer)))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Traslados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {transfers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay traslados agregados</p>
            <p className="text-sm">Haz clic en "Agregar traslado" para comenzar</p>
          </div>
        ) : (
          transfers.map((transfer, index) => (
            <div key={transfer.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Traslado {index + 1}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTransfer(transfer.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`nombre-${transfer.id}`}>Nombre de Empresa de Traslado</Label>
                <Input
                  id={`nombre-${transfer.id}`}
                  value={transfer.nombre}
                  onChange={(e) => updateTransfer(transfer.id, "nombre", e.target.value)}
                  placeholder="Ej: Transfer Express, Taxi Premium, Bus Turístico"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`origen-${transfer.id}`}>Origen</Label>
                  <Input
                    id={`origen-${transfer.id}`}
                    value={transfer.origen}
                    onChange={(e) => updateTransfer(transfer.id, "origen", e.target.value)}
                    placeholder="Ej: Aeropuerto, Hotel, Terminal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`destino-${transfer.id}`}>Destino</Label>
                  <Input
                    id={`destino-${transfer.id}`}
                    value={transfer.destino}
                    onChange={(e) => updateTransfer(transfer.id, "destino", e.target.value)}
                    placeholder="Ej: Hotel, Aeropuerto, Centro"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`tipoTraslado-${transfer.id}`}>Tipo de traslado</Label>
                <Select
                  value={transfer.tipoTraslado}
                  onValueChange={(value) => updateTransfer(transfer.id, "tipoTraslado", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de traslado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="privado">Privado</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`fecha-${transfer.id}`}>Fecha</Label>
                  <Input
                    id={`fecha-${transfer.id}`}
                    type="date"
                    value={transfer.fecha}
                    onChange={(e) => updateTransfer(transfer.id, "fecha", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`hora-${transfer.id}`}>Hora</Label>
                  <Input
                    id={`hora-${transfer.id}`}
                    type="time"
                    value={transfer.hora}
                    onChange={(e) => updateTransfer(transfer.id, "hora", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    id={`useCustomCurrency-${transfer.id}`}
                    type="checkbox"
                    checked={transfer.useCustomCurrency || false}
                    onChange={(e) => updateTransfer(transfer.id, "useCustomCurrency", e.target.checked)}
                    className="accent-blue-600 h-4 w-4"
                  />
                  <Label htmlFor={`useCustomCurrency-${transfer.id}`}>Usar moneda personalizada para este traslado</Label>
                  {transfer.useCustomCurrency && (
                    <select
                      value={transfer.currency || selectedCurrency}
                      onChange={e => updateTransfer(transfer.id, "currency", e.target.value)}
                      className="ml-2 border rounded px-2 py-1"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="ARS">ARS</option>
                    </select>
                  )}
                  {!transfer.useCustomCurrency && (
                    <span className="ml-2 text-xs text-gray-500">(actualmente {selectedCurrency})</span>
                  )}
                </div>
                <Label htmlFor={`precio-${transfer.id}`}>Precio</Label>
                <Input
                  id={`precio-${transfer.id}`}
                  value={transfer.precio}
                  onChange={(e) => updateTransfer(transfer.id, "precio", e.target.value)}
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0"
                />
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
              </div>

              <MultiImageUpload
                id={`imagenes-traslado-${transfer.id}`}
                label="Imágenes del traslado"
                images={transfer.imagenes}
                onImagesChange={(images) => updateTransfer(transfer.id, "imagenes", images)}
                maxImages={6}
              />

              <div className="space-y-2">
                <Label htmlFor={`textoLibre-${transfer.id}`}>Comentarios adicionales</Label>
                <Textarea
                  id={`textoLibre-${transfer.id}`}
                  value={transfer.textoLibre}
                  onChange={(e) => updateTransfer(transfer.id, "textoLibre", e.target.value)}
                  placeholder="Información adicional sobre el traslado..."
                  rows={3}
                />
              </div>
            </div>
          ))
        )}

        <Button onClick={addTransfer} className="w-full" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Agregar traslado
        </Button>
      </CardContent>
    </Card>
  )
}
