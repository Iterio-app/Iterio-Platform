"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin } from "lucide-react"
import CompactMonthSelector from "./compact-month-selector"

interface DestinationData {
  pais: string
  ciudad: string
  año: string
  meses: string[]
}

interface DestinationSectionProps {
  destinationData: DestinationData
  onChange: (data: DestinationData) => void
}

export default function DestinationSection({ destinationData, onChange }: DestinationSectionProps) {
  const handleChange = (field: keyof DestinationData, value: string | string[]) => {
    onChange({ ...destinationData, [field]: value })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Destino y Año
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pais">País</Label>
            <Input
              id="pais"
              value={destinationData.pais}
              onChange={(e) => handleChange("pais", e.target.value)}
              placeholder="Ej: Francia"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ciudad">Ciudad</Label>
            <Input
              id="ciudad"
              value={destinationData.ciudad}
              onChange={(e) => handleChange("ciudad", e.target.value)}
              placeholder="Ej: París"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="año">Año</Label>
            <Input
              id="año"
              value={destinationData.año}
              onChange={(e) => handleChange("año", e.target.value)}
              placeholder="Ej: 2024"
              type="number"
              min="2024"
              max="2030"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Meses del viaje</Label>
          <CompactMonthSelector
            selectedMonths={destinationData.meses || []}
            year={destinationData.año || new Date().getFullYear().toString()}
            onMonthsChange={(months) => handleChange("meses", months)}
            onYearChange={(year) => handleChange("año", year)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
