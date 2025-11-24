"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Ship } from "lucide-react"
import MultiImageUpload from "./multi-image-upload"

interface Cruise {
  id: string
  empresa: string
  nombreBarco: string
  destino: string
  fechaPartida: string
  fechaRegreso: string
  tipoCabina: string
  cantidadDias: number
  precio: string
  mostrarPrecio: boolean
  imagenes: string[]
  useCustomCurrency?: boolean
  currency?: string
}

interface CruiseSectionProps {
  cruises: Cruise[]
  onChange: (cruises: Cruise[]) => void
  selectedCurrency: string
  onMarkAsChanged?: () => void
}

export default function CruiseSection({ cruises, onChange, selectedCurrency, onMarkAsChanged }: CruiseSectionProps) {
  const updateCruise = (id: string, field: keyof Cruise, value: string | string[] | boolean | number) => {
    const updatedCruises = cruises.map((cruise) => {
      if (cruise.id === id) {
        const updatedCruise = { ...cruise, [field]: value }
        
        // Calcular automáticamente la cantidad de días cuando cambien las fechas
        if (field === 'fechaPartida' || field === 'fechaRegreso') {
          if (updatedCruise.fechaPartida && updatedCruise.fechaRegreso) {
            const partida = new Date(updatedCruise.fechaPartida)
            const regreso = new Date(updatedCruise.fechaRegreso)
            const diffTime = Math.abs(regreso.getTime() - partida.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            updatedCruise.cantidadDias = diffDays
          }
        }
        
        return updatedCruise
      }
      return cruise
    })
    onChange(updatedCruises)
    onMarkAsChanged?.()
  }

  const addCruise = () => {
    const newCruise: Cruise = {
      id: Date.now().toString(),
      empresa: "",
      nombreBarco: "",
      destino: "",
      fechaPartida: "",
      fechaRegreso: "",
      tipoCabina: "",
      cantidadDias: 0,
      precio: "",
      mostrarPrecio: true,
      imagenes: [],
      useCustomCurrency: false,
      currency: selectedCurrency,
    }
    onChange([...cruises, newCruise])
    onMarkAsChanged?.()
  }

  const removeCruise = (id: string) => {
    onChange(cruises.filter((cruise) => cruise.id !== id))
    onMarkAsChanged?.()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ship className="h-5 w-5" />
          Cruceros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {cruises.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Ship className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay cruceros agregados</p>
            <p className="text-sm">Haz clic en "Agregar crucero" para comenzar</p>
          </div>
        ) : (
          cruises.map((cruise, index) => (
            <div key={cruise.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Crucero {index + 1}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCruise(cruise.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`empresa-${cruise.id}`}>Empresa</Label>
                  <Input
                    id={`empresa-${cruise.id}`}
                    value={cruise.empresa}
                    onChange={(e) => updateCruise(cruise.id, "empresa", e.target.value)}
                    placeholder="Ej: Royal Caribbean"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`nombreBarco-${cruise.id}`}>Nombre del Barco</Label>
                  <Input
                    id={`nombreBarco-${cruise.id}`}
                    value={cruise.nombreBarco}
                    onChange={(e) => updateCruise(cruise.id, "nombreBarco", e.target.value)}
                    placeholder="Ej: Symphony of the Seas"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`destino-${cruise.id}`}>Destino</Label>
                  <Input
                    id={`destino-${cruise.id}`}
                    value={cruise.destino}
                    onChange={(e) => updateCruise(cruise.id, "destino", e.target.value)}
                    placeholder="Ej: Caribe Oriental"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`tipoCabina-${cruise.id}`}>Tipo de Cabina</Label>
                  <Input
                    id={`tipoCabina-${cruise.id}`}
                    value={cruise.tipoCabina}
                    onChange={(e) => updateCruise(cruise.id, "tipoCabina", e.target.value)}
                    placeholder="Ej: Interior, Balcón, Suite"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`fechaPartida-${cruise.id}`}>Fecha de Partida</Label>
                  <Input
                    id={`fechaPartida-${cruise.id}`}
                    type="date"
                    value={cruise.fechaPartida}
                    onChange={(e) => updateCruise(cruise.id, "fechaPartida", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`fechaRegreso-${cruise.id}`}>Fecha de Regreso</Label>
                  <Input
                    id={`fechaRegreso-${cruise.id}`}
                    type="date"
                    value={cruise.fechaRegreso}
                    onChange={(e) => updateCruise(cruise.id, "fechaRegreso", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`cantidadDias-${cruise.id}`}>Cantidad de Días</Label>
                  <Input
                    id={`cantidadDias-${cruise.id}`}
                    type="number"
                    value={cruise.cantidadDias}
                    readOnly
                    className="bg-gray-50"
                    placeholder="Se calcula automáticamente"
                  />
                  <p className="text-xs text-gray-500">
                    Se calcula automáticamente basado en las fechas
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    id={`useCustomCurrency-${cruise.id}`}
                    type="checkbox"
                    checked={cruise.useCustomCurrency || false}
                    onChange={(e) => updateCruise(cruise.id, "useCustomCurrency", e.target.checked)}
                    className="accent-blue-600 h-4 w-4"
                  />
                  <Label htmlFor={`useCustomCurrency-${cruise.id}`}>Usar moneda personalizada para este crucero</Label>
                  {cruise.useCustomCurrency && (
                    <select
                      value={cruise.currency || selectedCurrency}
                      onChange={e => updateCruise(cruise.id, "currency", e.target.value)}
                      className="ml-2 border rounded px-2 py-1"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="ARS">ARS</option>
                      <option value="BRL">BRL</option>
                      <option value="CLP">CLP</option>
                      <option value="COP">COP</option>
                      <option value="PEN">PEN</option>
                      <option value="UYU">UYU</option>
                    </select>
                  )}
                  {!cruise.useCustomCurrency && (
                    <span className="ml-2 text-xs text-gray-500">(actualmente {selectedCurrency})</span>
                  )}
                </div>
                <Label htmlFor={`precio-${cruise.id}`}>Precio del Servicio</Label>
                <Input
                  id={`precio-${cruise.id}`}
                  value={cruise.precio}
                  onChange={(e) => updateCruise(cruise.id, "precio", e.target.value)}
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0"
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    id={`mostrarPrecio-${cruise.id}`}
                    type="checkbox"
                    checked={cruise.mostrarPrecio}
                    onChange={e => updateCruise(cruise.id, "mostrarPrecio", e.target.checked)}
                    className="accent-blue-600 h-4 w-4"
                  />
                  <Label htmlFor={`mostrarPrecio-${cruise.id}`} className="text-sm">
                    Mostrar precio en el PDF
                  </Label>
                </div>
              </div>

              <MultiImageUpload
                id={`imagenes-crucero-${cruise.id}`}
                label="Imágenes del crucero"
                images={cruise.imagenes}
                onImagesChange={(images) => updateCruise(cruise.id, "imagenes", images)}
                maxImages={6}
              />
            </div>
          ))
        )}

        <Button onClick={addCruise} className="w-full" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Agregar crucero
        </Button>
      </CardContent>
    </Card>
  )
}
