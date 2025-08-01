"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FileText, Search, Calendar, DollarSign, Eye, Trash2, Download, Plus, Pencil } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { useQuotes } from "@/hooks/use-quotes"
import type { User } from "@supabase/supabase-js"
import type { Quote } from "@/lib/supabase"
import { groupAmountsByCurrency } from "@/lib/utils"

interface QuotesHistoryProps {
  user: User
  onLoadQuote?: (quote: Quote) => void
  onCreateNew?: () => void
}

export default function QuotesHistory({ user, onLoadQuote, onCreateNew }: QuotesHistoryProps) {
  const { quotes, isLoading, error, deleteQuote } = useQuotes(user)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null)

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch =
      quote.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.destination?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || quote.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "sent":
        return "bg-blue-100 text-blue-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completada"
      case "sent":
        return "Enviada"
      case "draft":
        return "Borrador"
      default:
        return "Borrador"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Cargando cotizaciones...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Mis Cotizaciones ({quotes.length})
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros y búsqueda */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por título, cliente o destino..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">Todos los estados</option>
            <option value="draft">Borradores</option>
            <option value="completed">Completadas</option>
            <option value="sent">Enviadas</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {filteredQuotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">
              {quotes.length === 0 ? "No tienes cotizaciones guardadas" : "No se encontraron cotizaciones"}
            </p>
            <p className="text-sm">
              {quotes.length === 0
                ? "Crea tu primera cotización para verla aquí"
                : "Intenta con otros términos de búsqueda"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuotes.map((quote) => {
              // Agrupar totales por moneda
              const accommodationTotals = groupAmountsByCurrency(quote.accommodations_data || [], quote.summary_data?.currency || "USD", "precioTotal");
              const transferTotals = groupAmountsByCurrency(quote.transfers_data || [], quote.summary_data?.currency || "USD", "precio");
              const serviceTotals = groupAmountsByCurrency(quote.services_data || [], quote.summary_data?.currency || "USD", "precio");
              const cruiseTotals = groupAmountsByCurrency(quote.cruises_data || [], quote.summary_data?.currency || "USD", "precio");
              const allTotals = { ...accommodationTotals };
              for (const [currency, amount] of Object.entries(transferTotals)) {
                allTotals[currency] = (allTotals[currency] || 0) + amount;
              }
              for (const [currency, amount] of Object.entries(serviceTotals)) {
                allTotals[currency] = (allTotals[currency] || 0) + amount;
              }
              for (const [currency, amount] of Object.entries(cruiseTotals)) {
                allTotals[currency] = (allTotals[currency] || 0) + amount;
              }

              // Inferir tipo de cotización
              const hasFlights = quote.flights_data && quote.flights_data.length > 0;
              const hasAccommodations = quote.accommodations_data && quote.accommodations_data.length > 0;
              const hasTransfers = quote.transfers_data && quote.transfers_data.length > 0;
              const hasServices = quote.services_data && quote.services_data.length > 0;
              const hasCruises = quote.cruises_data && quote.cruises_data.length > 0;
              let tipoCotizacion = "";
              if (hasCruises && !hasFlights && !hasAccommodations && !hasTransfers && !hasServices) {
                tipoCotizacion = "Crucero";
              } else if (hasFlights && !hasAccommodations && !hasTransfers && !hasServices && !hasCruises) {
                tipoCotizacion = "Vuelo";
              } else if (hasFlights && hasAccommodations && !hasTransfers && !hasServices && !hasCruises) {
                tipoCotizacion = "Vuelo + Alojamiento";
              } else if (hasFlights && (hasAccommodations || hasTransfers || hasServices || hasCruises)) {
                tipoCotizacion = "Itinerario completo";
              } else if (hasCruises && (hasAccommodations || hasTransfers || hasServices)) {
                tipoCotizacion = "Itinerario completo";
              } else {
                tipoCotizacion = "Personalizada";
              }

              return (
                <div key={quote.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-lg">{quote.title}</h3>
                        <Badge className={getStatusColor(quote.status || "draft")}>{getStatusText(quote.status || "draft")}</Badge>
                        <Badge variant="outline" className="ml-2 text-xs px-2 py-1">
                          {tipoCotizacion}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        {quote.destination && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Destino:</span>
                            <span>{quote.destination}</span>
                          </div>
                        )}
                        {quote.client_name && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Cliente:</span>
                            <span>{quote.client_name}</span>
                          </div>
                        )}
                        {/* Mostrar totales por moneda */}
                        {Object.keys(allTotals).length > 0 && (
                          <div className="flex items-center gap-1">
                            {Object.entries(allTotals).map(([currency, amount]) => (
                              <span key={currency} className="font-medium mr-2">{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(quote.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {onLoadQuote && (
                        <Button variant="outline" size="sm" onClick={() => onLoadQuote(quote)}>
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      )}
                      {quote.pdf_url && (
                        <Button variant="outline" size="sm" onClick={() => window.open(quote.pdf_url!, "_blank") }>
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowDeleteConfirm(true)
                          setQuoteToDelete(quote)
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      
      {/* Modal de confirmación de eliminación */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar cotización?</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            ¿Estás seguro de que quieres eliminar la cotización "{quoteToDelete?.title}"? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (quoteToDelete) {
                  deleteQuote(quoteToDelete.id)
                  setShowDeleteConfirm(false)
                  setQuoteToDelete(null)
                }
              }}
            >
              Eliminar
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
