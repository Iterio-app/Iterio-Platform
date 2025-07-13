"use client"

import { useState, useEffect } from "react"
import { supabase, type Quote } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

export function useQuotes(user: User | null) {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar cotizaciones del usuario
  const fetchQuotes = async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setQuotes(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
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

    // Actualizar lista local
    setQuotes((prev) => [data, ...prev])
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

    // Actualizar lista local
    setQuotes((prev) => prev.map((quote) => (quote.id === id ? data : quote)))
    return data
  }

  // Eliminar cotización
  const deleteQuote = async (id: string) => {
    if (!user) throw new Error("Usuario no autenticado")

    const { error } = await supabase.from("quotes").delete().eq("id", id).eq("user_id", user.id)

    if (error) throw error

    // Actualizar lista local
    setQuotes((prev) => prev.filter((quote) => quote.id !== id))
  }

  useEffect(() => {
    fetchQuotes()
  }, [user])

  return {
    quotes,
    isLoading,
    error,
    saveQuote,
    updateQuote,
    deleteQuote,
    refetch: fetchQuotes,
  }
}
