"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Search, 
  Calendar, 
  DollarSign, 
  Eye, 
  Trash2, 
  Download, 
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Mail,
  MapPin,
  User as UserIcon
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useQuotes } from "@/hooks/use-quotes"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import type { Quote } from "@/lib/supabase"
import { groupAmountsByCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface QuotesHistoryEnhancedProps {
  user: SupabaseUser
  onLoadQuote?: (quote: Quote) => void
  onCreateNew?: () => void
}

const ITEMS_PER_PAGE = 10

export default function QuotesHistoryEnhanced({ user, onLoadQuote, onCreateNew }: QuotesHistoryEnhancedProps) {
  const { quotes, isLoading, error, deleteQuote, fetchQuoteById, refetch } = useQuotes(user)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null)
  const [generatingPreview, setGeneratingPreview] = useState<string | null>(null)
  const [loadingQuoteId, setLoadingQuoteId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch quotes when component mounts
  useEffect(() => {
    refetch()
  }, [])

  // Filter quotes based on search and status
  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const matchesSearch =
        quote.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.destination?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || quote.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [quotes, searchTerm, statusFilter])

  // Pagination
  const totalPages = Math.ceil(filteredQuotes.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentQuotes = filteredQuotes.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  const handleDeleteQuote = async (quote: Quote) => {
    setQuoteToDelete(quote)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (quoteToDelete) {
      await deleteQuote(quoteToDelete.id)
      setShowDeleteConfirm(false)
      setQuoteToDelete(null)
    }
  }

  const handleLoadQuote = async (quoteId: string) => {
    setLoadingQuoteId(quoteId)
    try {
      const quote = await fetchQuoteById(quoteId)
      if (quote && onLoadQuote) {
        onLoadQuote(quote)
      }
    } finally {
      setLoadingQuoteId(null)
    }
  }

  const generatePreview = async (quote: Quote) => {
    setGeneratingPreview(quote.id)
    try {
      // Generar el HTML de la vista previa
      const html = await generateQuotePreviewHTML(quote)
      
      // Abrir en una nueva ventana
      const newWindow = window.open('', '_blank', 'width=800,height=600')
      if (newWindow) {
        newWindow.document.write(html)
        newWindow.document.close()
        newWindow.document.title = 'Vista Previa de Cotización'
      }
    } catch (err) {
      console.error('Error al generar vista previa:', err)
      alert('Error al generar la vista previa')
    } finally {
      setGeneratingPreview(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return 'Hoy'
    } else if (diffDays === 1) {
      return 'Ayer'
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`
    } else {
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    }
  }

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      ARS: '$',
    }
    return symbols[currency] || currency
  }

  if (isLoading && quotes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando cotizaciones...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Mis Cotizaciones</h2>
            <Badge variant="secondary" className="text-sm">
              {filteredQuotes.length} {filteredQuotes.length === 1 ? 'cotización' : 'cotizaciones'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch(true)}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Actualizar
            </Button>
            {onCreateNew && (
              <Button
                onClick={onCreateNew}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Nueva cotización
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar cotizaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="draft">Borrador</option>
              <option value="sent">Enviada</option>
              <option value="approved">Aprobada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quotes List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {currentQuotes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {searchTerm || statusFilter !== 'all' 
                ? 'No se encontraron cotizaciones' 
                : 'No tienes cotizaciones aún'
              }
            </p>
            {onCreateNew && !searchTerm && statusFilter === 'all' && (
              <Button onClick={onCreateNew} className="mt-4">
                Crear tu primera cotización
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {currentQuotes.map((quote) => (
              <Card 
                key={quote.id} 
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => handleLoadQuote(quote.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {quote.title}
                        </h3>
                        <Badge 
                          variant={quote.status === 'draft' ? 'secondary' : 
                                  quote.status === 'sent' ? 'default' : 'default'}
                          className={cn(
                            "text-xs",
                            quote.status === 'draft' && "bg-gray-100 text-gray-600",
                            quote.status === 'sent' && "bg-blue-100 text-blue-700",
                            quote.status === 'approved' && "bg-green-100 text-green-700"
                          )}
                        >
                          {quote.status === 'draft' ? 'Borrador' : 
                           quote.status === 'sent' ? 'Enviada' : 'Aprobada'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {quote.client_name && (
                          <span className="flex items-center gap-1">
                            <UserIcon className="h-3 w-3" />
                            {quote.client_name}
                          </span>
                        )}
                        {quote.destination && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {quote.destination}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(quote.created_at)}
                        </span>
                      </div>

                      {quote.total_amount && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-lg font-semibold text-gray-900">
                            {getCurrencySymbol(quote.summary_data?.currency || 'USD')}{quote.total_amount.toLocaleString()}
                          </span>
                          {quote.summary_data?.currency && (
                            <Badge variant="outline" className="text-xs">
                              {quote.summary_data.currency}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleLoadQuote(quote.id)
                        }}
                        disabled={loadingQuoteId === quote.id}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              generatePreview(quote)
                            }}
                            disabled={generatingPreview === quote.id}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Vista previa
                          </DropdownMenuItem>
                          {quote.pdf_url && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(quote.pdf_url, '_blank')
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Descargar PDF
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteQuote(quote)
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Mostrando {startIndex + 1}-{Math.min(endIndex, filteredQuotes.length)} de {filteredQuotes.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar cotización?</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            ¿Estás seguro de que deseas eliminar la cotización "{quoteToDelete?.title}"? 
            Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper function to generate preview HTML
async function generateQuotePreviewHTML(quote: Quote): Promise<string> {
  // This would be the same logic as in your existing component
  // For now, returning a simple template
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${quote.title} - Vista Previa</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .content { max-width: 800px; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div class="content">
          <div class="header">
            <h1>${quote.title}</h1>
            <p>Cliente: ${quote.client_name || 'N/A'}</p>
            <p>Destino: ${quote.destination || 'N/A'}</p>
            <p>Total: ${quote.total_amount || 'N/A'} ${quote.summary_data?.currency || ''}</p>
          </div>
        </div>
      </body>
    </html>
  `
}
