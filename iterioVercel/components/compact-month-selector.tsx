"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"

interface CompactMonthSelectorProps {
  selectedMonths: string[]
  year: string
  onMonthsChange: (months: string[]) => void
  onYearChange: (year: string) => void
}

const monthsData = [
  { value: "01", short: "ene", full: "Enero" },
  { value: "02", short: "feb", full: "Febrero" },
  { value: "03", short: "mar", full: "Marzo" },
  { value: "04", short: "abr", full: "Abril" },
  { value: "05", short: "may", full: "Mayo" },
  { value: "06", short: "jun", full: "Junio" },
  { value: "07", short: "jul", full: "Julio" },
  { value: "08", short: "ago", full: "Agosto" },
  { value: "09", short: "sept", full: "Septiembre" },
  { value: "10", short: "oct", full: "Octubre" },
  { value: "11", short: "nov", full: "Noviembre" },
  { value: "12", short: "dic", full: "Diciembre" },
]

export default function CompactMonthSelector({
  selectedMonths,
  year,
  onMonthsChange,
  onYearChange,
}: CompactMonthSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMonth = (monthValue: string) => {
    if (selectedMonths.includes(monthValue)) {
      onMonthsChange(selectedMonths.filter((m) => m !== monthValue))
    } else {
      onMonthsChange([...selectedMonths, monthValue].sort())
    }
  }

  const clearSelection = () => {
    onMonthsChange([])
  }

  const getSelectedRange = () => {
    if (selectedMonths.length === 0) return "Seleccionar meses"
    if (selectedMonths.length === 1) {
      const month = monthsData.find((m) => m.value === selectedMonths[0])
      return month?.full || ""
    }

    // Ordenar meses seleccionados
    const sortedMonths = [...selectedMonths].sort()
    const firstMonth = monthsData.find((m) => m.value === sortedMonths[0])
    const lastMonth = monthsData.find((m) => m.value === sortedMonths[sortedMonths.length - 1])

    // Verificar si son consecutivos
    const firstIndex = monthsData.findIndex((m) => m.value === sortedMonths[0])
    const lastIndex = monthsData.findIndex((m) => m.value === sortedMonths[sortedMonths.length - 1])
    const expectedLength = lastIndex - firstIndex + 1

    if (sortedMonths.length === expectedLength) {
      // Son consecutivos, mostrar como rango
      return `${firstMonth?.full} - ${lastMonth?.full}`
    } else {
      // No son consecutivos, mostrar cantidad
      return `${sortedMonths.length} meses seleccionados`
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between text-left font-normal"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="truncate">{getSelectedRange()}</span>
          <Calendar className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4">
          {/* Selector de año compacto */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onYearChange((Number.parseInt(year) - 1).toString())}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold">{year}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onYearChange((Number.parseInt(year) + 1).toString())}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Grid de meses compacto */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {monthsData.map((month) => (
              <button
                key={month.value}
                onClick={() => toggleMonth(month.value)}
                className={`
                  h-10 text-sm font-medium rounded-md border transition-all duration-200
                  ${
                    selectedMonths.includes(month.value)
                      ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                      : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                  }
                `}
              >
                {month.short}
              </button>
            ))}
          </div>

          {/* Acciones */}
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-xs text-gray-500">
              {selectedMonths.length} mes{selectedMonths.length !== 1 ? "es" : ""} seleccionado
              {selectedMonths.length !== 1 ? "s" : ""}
            </span>
            <div className="flex gap-2">
              {selectedMonths.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearSelection} className="text-xs">
                  Limpiar
                </Button>
              )}
              <Button size="sm" onClick={() => setIsOpen(false)} className="text-xs">
                Listo
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
