"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

interface MonthSelectorProps {
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

export default function MonthSelector({ selectedMonths, year, onMonthsChange, onYearChange }: MonthSelectorProps) {
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
    if (selectedMonths.length === 0) return ""
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
      // No son consecutivos, mostrar todos
      return sortedMonths.map((m) => monthsData.find((month) => month.value === m)?.full).join(", ")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Seleccionar Meses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selector de año */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" onClick={() => onYearChange((Number.parseInt(year) - 1).toString())}>
            ←
          </Button>
          <span className="text-2xl font-bold min-w-[80px] text-center">{year}</span>
          <Button variant="outline" size="sm" onClick={() => onYearChange((Number.parseInt(year) + 1).toString())}>
            →
          </Button>
        </div>

        {/* Grid de meses */}
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
          {monthsData.map((month) => (
            <button
              key={month.value}
              onClick={() => toggleMonth(month.value)}
              className={`
                relative h-16 w-full rounded-lg border-2 transition-all duration-200 font-medium
                ${
                  selectedMonths.includes(month.value)
                    ? "bg-blue-500 text-white border-blue-500 shadow-lg scale-105"
                    : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                }
              `}
            >
              {month.short}
              {selectedMonths.includes(month.value) && (
                <div className="absolute inset-0 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">{month.short}</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Mostrar selección actual */}
        {selectedMonths.length > 0 && (
          <div className="text-center space-y-2">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Meses seleccionados:</p>
              <p className="text-blue-800 font-bold">{getSelectedRange()}</p>
            </div>
            <Button variant="outline" size="sm" onClick={clearSelection}>
              Limpiar selección
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
