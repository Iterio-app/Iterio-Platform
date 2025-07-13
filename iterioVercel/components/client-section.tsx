"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users } from "lucide-react"

interface ClientSectionProps {
  clientData: {
    cantidadPasajeros: number
    cantidadAdultos: number
    cantidadMenores: number
    cantidadInfantes: number
  }
  onChange: (data: any) => void
  mostrarCantidadPasajeros: boolean
  setMostrarCantidadPasajeros: (value: boolean) => void
}

export default function ClientSection({ clientData, onChange, mostrarCantidadPasajeros, setMostrarCantidadPasajeros }: ClientSectionProps) {
  const handleChange = (field: string, value: number) => {
    const updatedData = { ...clientData, [field]: value }

    // Calcular total de pasajeros automáticamente
    const total = updatedData.cantidadAdultos + updatedData.cantidadMenores + updatedData.cantidadInfantes
    updatedData.cantidadPasajeros = total

    onChange(updatedData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Datos del Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cantidadPasajeros">Total Pasajeros</Label>
            <Input
              id="cantidadPasajeros"
              value={clientData.cantidadPasajeros.toString()}
              readOnly
              className="bg-gray-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cantidadAdultos">Cantidad Adultos</Label>
            <Select
              value={clientData.cantidadAdultos.toString()}
              onValueChange={(value) => handleChange("cantidadAdultos", Number.parseInt(value))}
            >
              <SelectTrigger id="cantidadAdultos">
                <SelectValue placeholder="0" />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cantidadMenores">Cantidad Menores</Label>
            <Select
              value={clientData.cantidadMenores.toString()}
              onValueChange={(value) => handleChange("cantidadMenores", Number.parseInt(value))}
            >
              <SelectTrigger id="cantidadMenores">
                <SelectValue placeholder="0" />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cantidadInfantes">Cantidad Infantes</Label>
            <Select
              value={clientData.cantidadInfantes.toString()}
              onValueChange={(value) => handleChange("cantidadInfantes", Number.parseInt(value))}
            >
              <SelectTrigger id="cantidadInfantes">
                <SelectValue placeholder="0" />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <input
            id="mostrarCantidadPasajeros"
            type="checkbox"
            checked={mostrarCantidadPasajeros}
            onChange={e => setMostrarCantidadPasajeros(e.target.checked)}
            className="accent-blue-600 h-4 w-4"
          />
          <Label htmlFor="mostrarCantidadPasajeros" className="text-sm">
            Mostrar cantidad de pasajeros en el PDF
          </Label>
        </div>
      </CardContent>
    </Card>
  )
}
