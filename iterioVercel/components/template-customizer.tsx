"use client"

import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Palette, Type, Building } from "lucide-react"
import ColorPicker from "./color-picker"
import { useCallback } from "react"

interface Template {
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  logo: string | null
  agencyName: string
  agencyAddress: string
  agencyPhone: string
  agencyEmail: string
  validityText: string
}

interface TemplateCustomizerProps {
  template: Template
  onTemplateChange: (template: Template) => void
}

export default function TemplateCustomizer({ template, onTemplateChange }: TemplateCustomizerProps) {
  const handleInputChange = useCallback(
    (field: keyof Template, value: string) => {
      onTemplateChange({ ...template, [field]: value })
    },
    [template, onTemplateChange],
  )

  const handleColorChange = useCallback(
    (field: "primaryColor" | "secondaryColor", color: string) => {
      onTemplateChange({ ...template, [field]: color })
    },
    [template, onTemplateChange],
  )

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const logoData = e.target?.result as string
        onTemplateChange({ ...template, logo: logoData })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Información de la Agencia
            </CardTitle>
            <CardDescription>Configura los datos que aparecerán en el encabezado del PDF</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agency-name">Nombre de la Agencia</Label>
              <Input
                id="agency-name"
                value={template.agencyName}
                onChange={(e) => handleInputChange("agencyName", e.target.value)}
                placeholder="Tu Agencia de Viajes"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agency-address">Dirección</Label>
              <Textarea
                id="agency-address"
                value={template.agencyAddress}
                onChange={(e) => handleInputChange("agencyAddress", e.target.value)}
                placeholder="Dirección completa de la agencia"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agency-phone">Teléfono</Label>
                <Input
                  id="agency-phone"
                  value={template.agencyPhone}
                  onChange={(e) => handleInputChange("agencyPhone", e.target.value)}
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agency-email">Email</Label>
                <Input
                  id="agency-email"
                  type="email"
                  value={template.agencyEmail}
                  onChange={(e) => handleInputChange("agencyEmail", e.target.value)}
                  placeholder="info@tuagencia.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validity-text">Texto de validez</Label>
              <Textarea
                id="validity-text"
                value={template.validityText}
                onChange={(e) => handleInputChange("validityText", e.target.value)}
                placeholder="Esta cotización es válida por 15 días desde la fecha de emisión."
                rows={3}
              />
              <p className="text-sm text-gray-600">
                Este texto aparecerá en un recuadro con borde negro y letras rojas en el PDF
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo-upload">Logo de la Agencia</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {template.logo ? (
                  <div className="space-y-2">
                    <img src={template.logo || "/placeholder.svg"} alt="Logo" className="h-16 mx-auto object-contain" />
                    <Button variant="outline" size="sm" onClick={() => onTemplateChange({ ...template, logo: null })}>
                      Cambiar Logo
                    </Button>
                  </div>
                ) : (
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-600">Subir Logo</span>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </Label>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Colores del Diseño
            </CardTitle>
            <CardDescription>Personaliza los colores para que coincidan con tu marca</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <ColorPicker
                value={template.primaryColor}
                onChange={(color) => handleColorChange("primaryColor", color)}
                label="Color Primario"
              />

              <ColorPicker
                value={template.secondaryColor}
                onChange={(color) => handleColorChange("secondaryColor", color)}
                label="Color Secundario"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Tipografía
            </CardTitle>
            <CardDescription>Selecciona la fuente que mejor represente tu marca</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="font-family">Familia de Fuente</Label>
              <Select
                value={template.fontFamily}
                onValueChange={(value) => onTemplateChange({ ...template, fontFamily: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una fuente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter (Moderna)</SelectItem>
                  <SelectItem value="Arial">Arial (Clásica)</SelectItem>
                  <SelectItem value="Helvetica">Helvetica (Profesional)</SelectItem>
                  <SelectItem value="Georgia">Georgia (Elegante)</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman (Tradicional)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 border rounded-lg bg-gray-50">
              <p className="text-sm text-gray-600 mb-2">Vista previa:</p>
              <div style={{ fontFamily: template.fontFamily }}>
                <h3 className="text-lg font-bold mb-1">Cotización de Viaje</h3>
                <p className="text-sm">Esta es una muestra de cómo se verá el texto en tu PDF</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vista Previa del Diseño</CardTitle>
            <CardDescription>Así se verá tu PDF</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border rounded-lg p-6 bg-white"
              style={{
                borderTopColor: template.primaryColor,
                borderTopWidth: "4px",
              }}
            >
              <div className="text-center mb-4">
                {template.logo && (
                  <img
                    src={template.logo || "/placeholder.svg"}
                    alt="Logo"
                    className="h-12 mb-2 object-contain mx-auto"
                  />
                )}
              </div>

              <div className="h-px mb-4" style={{ backgroundColor: template.primaryColor, opacity: 0.3 }} />

              {/* Ejemplo de destino más compacto */}
              <div
                className="text-center mb-4 p-3 rounded"
                style={{
                  background: `linear-gradient(135deg, ${template.primaryColor}15, ${template.primaryColor}05)`,
                  border: `2px solid ${template.primaryColor}`,
                }}
              >
                <h3
                  className="text-lg font-bold mb-1"
                  style={{
                    color: template.primaryColor,
                    fontFamily: template.fontFamily,
                  }}
                >
                  París, Francia
                </h3>
                <p className="text-sm" style={{ color: template.secondaryColor }}>
                  Marzo 2024
                </p>
              </div>

              {/* Ejemplo de sección */}
              <h3
                className="text-base font-semibold mb-2 pb-1 border-b-2"
                style={{
                  color: template.primaryColor,
                  fontFamily: template.fontFamily,
                  borderBottomColor: template.primaryColor,
                }}
              >
                VUELOS
              </h3>

              {/* Ejemplo de totales más compacto */}
              <div
                className="mt-4 p-4 rounded border-2"
                style={{
                  backgroundColor: "#f8f9fa",
                  borderColor: template.primaryColor,
                }}
              >
                <h4
                  className="text-base font-semibold mb-2 pb-1 border-b-2"
                  style={{
                    color: template.primaryColor,
                    borderBottomColor: template.primaryColor,
                  }}
                >
                  TOTAL DE LA COTIZACIÓN
                </h4>
                <div className="text-center py-2">
                  <div className="text-2xl font-bold" style={{ color: template.primaryColor }}>
                    $2,500.00
                  </div>
                </div>
              </div>

              {/* Vista previa del texto de validez */}
              <div className="border-2 border-black p-3 rounded bg-white mt-4">
                <p className="text-red-500 font-bold text-center text-sm">
                  {template.validityText || "Esta cotización es válida por 15 días desde la fecha de emisión."}
                </p>
              </div>

              {/* Footer actualizado */}
              <div className="mt-4 pt-3 border-t text-center text-sm">
                <div className="mb-2">
                  {template.agencyAddress && (
                    <div className="mb-1">
                      <span style={{ color: template.primaryColor, fontWeight: "bold" }}>Dirección: </span>
                      <span style={{ color: template.secondaryColor }}>{template.agencyAddress}</span>
                    </div>
                  )}
                  {template.agencyPhone && (
                    <div className="mb-1">
                      <span style={{ color: template.primaryColor, fontWeight: "bold" }}>Teléfono: </span>
                      <span style={{ color: template.secondaryColor }}>{template.agencyPhone}</span>
                    </div>
                  )}
                  {template.agencyEmail && (
                    <div className="mb-1">
                      <span style={{ color: template.primaryColor, fontWeight: "bold" }}>Email: </span>
                      <span style={{ color: template.secondaryColor }}>{template.agencyEmail}</span>
                    </div>
                  )}
                </div>
                <p style={{ color: template.secondaryColor }}>Generado automáticamente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
