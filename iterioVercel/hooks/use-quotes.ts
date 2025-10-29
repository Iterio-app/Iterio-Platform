"use client"

import { useState, useEffect, useRef } from "react"
import { supabase, type Quote } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

// ✅ Cache global fuera del hook para persistir entre montajes
let quotesCache: Quote[] = []
let lastQuotesFetch = 0
let isFetchingQuotes = false // Flag para evitar fetches simultáneos
const QUOTES_CACHE_DURATION = 30000 // 30 segundos

export function useQuotes(user: User | null) {
  const [quotes, setQuotes] = useState<Quote[]>(quotesCache) // Inicializar con cache
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar cotizaciones del usuario
  const fetchQuotes = async (force = false) => {
    if (!user) return

    // ✅ Evitar fetches simultáneos
    if (isFetchingQuotes && !force) {
      console.log(`📊 Ya hay un fetch en progreso, esperando...`)
      return
    }

    // ✅ OPTIMIZACIÓN: Cache global para evitar re-fetches innecesarios
    const now = Date.now()
    const timeSinceLastFetch = now - lastQuotesFetch
    
    if (!force && timeSinceLastFetch < QUOTES_CACHE_DURATION && quotesCache.length > 0) {
      console.log(`📊 Cotizaciones en cache (${Math.round(timeSinceLastFetch / 1000)}s desde última carga)`)
      setQuotes(quotesCache) // Asegurar que el estado local tenga el cache
      return
    }

    isFetchingQuotes = true
    setIsLoading(true)
    setError(null)

    try {
      // ✅ OPTIMIZACIÓN: Solo seleccionar campos necesarios para la lista
      // NO traer JSONB con imágenes (flights_data, accommodations_data, etc.)
      // Esto reduce el Egress de ~100MB a ~1MB por carga
      const { data, error } = await supabase
        .from("quotes")
        .select("id, user_id, title, destination, year, client_name, status, total_amount, pdf_url, created_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50) // Limitar a últimas 50 cotizaciones

      if (error) throw error
      
      // Actualizar cache global y estado local
      quotesCache = data || []
      lastQuotesFetch = now
      setQuotes(quotesCache)
      
      console.log(`📊 Cotizaciones cargadas: ${data?.length || 0} (sin imágenes - optimizado)`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      isFetchingQuotes = false
      setIsLoading(false)
    }
  }

  // Guardar nueva cotización
  const saveQuote = async (quoteData: {
    title: string
    destination?: string
    year?: string
    client_data?: any
    flights_data?: any
    accommodations_data?: any
    transfers_data?: any
    services_data?: any
    cruises_data?: any
    summary_data?: any
    template_data?: any
    total_amount?: number
    client_name?: string
    status?: string
  }) => {
    if (!user) throw new Error("Usuario no autenticado")

    const { data, error } = await supabase
      .from("quotes")
      .insert([
        {
          user_id: user.id,
          ...quoteData,
        },
      ])
      .select()
      .single()

    if (error) throw error

    // Actualizar cache global y lista local
    quotesCache = [data, ...quotesCache]
    setQuotes(quotesCache)
    return data
  }

  // Actualizar cotización existente
  const updateQuote = async (id: string, updates: Partial<Quote>) => {
    if (!user) throw new Error("Usuario no autenticado")

    const { data, error } = await supabase
      .from("quotes")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) throw error

    // Actualizar cache global y lista local
    quotesCache = quotesCache.map((quote) => (quote.id === id ? data : quote))
    setQuotes(quotesCache)
    return data
  }

  // Cargar cotización completa (con todos los datos incluyendo imágenes)
  // Solo se usa cuando el usuario va a editar una cotización
  const fetchQuoteById = async (id: string): Promise<Quote> => {
    if (!user) throw new Error("Usuario no autenticado")

    console.log(`📥 Cargando cotización completa: ${id}`)
    
    const { data, error } = await supabase
      .from("quotes")
      .select("*") // Aquí sí traemos todo porque lo necesitamos para editar
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error) throw error
    
    console.log(`✅ Cotización completa cargada (con imágenes)`)
    return data
  }

  // Eliminar cotización
  const deleteQuote = async (id: string) => {
    if (!user) throw new Error("Usuario no autenticado")

    // Primero obtener la cotización para ver si tiene PDF
    const quote = quotes.find((q) => q.id === id)
    
    // Si tiene PDF, eliminarlo del bucket primero
    if (quote?.pdf_url) {
      try {
        console.log('🗑️ Eliminando PDF del bucket:', quote.pdf_url)
        const response = await fetch('/api/delete-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfUrl: quote.pdf_url }),
        })
        
        if (!response.ok) {
          console.warn('⚠️ No se pudo eliminar el PDF del bucket, continuando...')
        } else {
          console.log('✅ PDF eliminado del bucket')
        }
      } catch (error) {
        console.warn('⚠️ Error al eliminar PDF del bucket:', error)
        // Continuar con la eliminación de la cotización aunque falle el PDF
      }
    }

    // Eliminar el registro de la base de datos
    const { error } = await supabase.from("quotes").delete().eq("id", id).eq("user_id", user.id)

    if (error) throw error

    // Actualizar cache global y lista local
    quotesCache = quotesCache.filter((quote) => quote.id !== id)
    setQuotes(quotesCache)
  }

  // ✅ Sincronizar estado local con cache al montar
  // NO hacer fetch automático - se hará cuando el usuario vaya a la tab
  useEffect(() => {
    if (quotesCache.length > 0) {
      setQuotes(quotesCache)
      console.log(`📊 [useEffect] Sincronizando con cache (${quotesCache.length} cotizaciones)`)
    }
  }, [user])

  return {
    quotes,
    isLoading,
    error,
    saveQuote,
    updateQuote,
    deleteQuote,
    fetchQuoteById,
    refetch: fetchQuotes,
  }
}
