"use client"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check } from "lucide-react"

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label: string
}

const themeColors = [
  "#8B4513",
  "#1F4E79",
  "#2F5F8F",
  "#D2691E",
  "#228B22",
  "#4682B4",
  "#9370DB",
  "#32CD32",
  "#A0522D",
  "#4169E1",
  "#5F9EA0",
  "#FF8C00",
  "#006400",
  "#87CEEB",
  "#BA55D3",
  "#90EE90",
]

const themeShades = [
  // Browns
  ["#F5F5DC", "#DEB887", "#D2B48C", "#BC8F8F", "#A0522D", "#8B4513", "#654321", "#3E2723"],
  // Blues
  ["#F0F8FF", "#E6F3FF", "#B3D9FF", "#80BFFF", "#4D9FFF", "#1F4E79", "#0D2A4A", "#051A2E"],
  // Teals
  ["#F0FFFF", "#E0F6F6", "#B3E5E5", "#80D4D4", "#4DC3C3", "#2F5F8F", "#1A4A6B", "#0D3547"],
  // Oranges
  ["#FFF8DC", "#FFEAA7", "#FFD93D", "#FFC107", "#FF8C00", "#D2691E", "#B8860B", "#8B4513"],
  // Greens
  ["#F0FFF0", "#E8F5E8", "#C8E6C9", "#A5D6A7", "#81C784", "#228B22", "#1B5E20", "#0D2818"],
  // Light Blues
  ["#F0F8FF", "#E1F5FE", "#B3E5FC", "#81D4FA", "#4FC3F7", "#4682B4", "#1976D2", "#0D47A1"],
  // Purples
  ["#F3E5F5", "#E1BEE7", "#CE93D8", "#BA68C8", "#AB47BC", "#9370DB", "#7B1FA2", "#4A148C"],
  // Light Greens
  ["#F1F8E9", "#DCEDC8", "#C5E1A5", "#AED581", "#9CCC65", "#32CD32", "#689F38", "#33691E"],
]

const standardColors = [
  "#FF0000",
  "#FF8000",
  "#FFFF00",
  "#80FF00",
  "#00FF00",
  "#00FF80",
  "#00FFFF",
  "#0080FF",
  "#0000FF",
  "#8000FF",
  "#FF00FF",
  "#FF0080",
]

export default function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: value }} />
              <span>{value}</span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3">
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium mb-2">Automático</div>
              <div
                className="w-full h-6 bg-black rounded border cursor-pointer hover:opacity-80"
                onClick={() => onChange("#000000")}
              />
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Colores del tema</div>
              <div className="grid grid-cols-8 gap-1 mb-2">
                {themeColors.map((color, index) => (
                  <div
                    key={index}
                    className="w-6 h-6 rounded border border-gray-300 cursor-pointer relative hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => onChange(color)}
                  >
                    {value === color && <Check className="w-3 h-3 text-white absolute top-0.5 left-0.5" />}
                  </div>
                ))}
              </div>

              {themeShades.map((shadeRow, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-8 gap-1 mb-1">
                  {shadeRow.map((shade, shadeIndex) => (
                    <div
                      key={shadeIndex}
                      className="w-6 h-6 rounded border border-gray-200 cursor-pointer relative hover:scale-110 transition-transform"
                      style={{ backgroundColor: shade }}
                      onClick={() => onChange(shade)}
                    >
                      {value === shade && <Check className="w-3 h-3 text-white absolute top-0.5 left-0.5" />}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Colores estándar</div>
              <div className="grid grid-cols-6 gap-1">
                {standardColors.map((color, index) => (
                  <div
                    key={index}
                    className="w-6 h-6 rounded border border-gray-300 cursor-pointer relative hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => onChange(color)}
                  >
                    {value === color && <Check className="w-3 h-3 text-white absolute top-0.5 left-0.5" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t">
              <button
                className="text-sm text-blue-600 hover:underline"
                onClick={() => {
                  const input = document.createElement("input")
                  input.type = "color"
                  input.value = value
                  input.onchange = (e) => onChange((e.target as HTMLInputElement).value)
                  input.click()
                }}
              >
                🎨 Más colores...
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
