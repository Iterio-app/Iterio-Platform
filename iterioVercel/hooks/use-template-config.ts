"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

interface TemplateConfig {
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

const defaultTemplate: TemplateConfig = {
  primaryColor: "#2563eb",
  secondaryColor: "#64748b",
  fontFamily: "Inter",
  logo: null,
  agencyName: "Tu Agencia de Viajes",
  agencyAddress: "Dirección de la agencia",
  agencyPhone: "+1 234 567 8900",
  agencyEmail: "info@tuagencia.com",
  validityText: "Esta cotización es válida por 15 días desde la fecha de emisión.",
}

export function useTemplateConfig(user: User | null) {
  const [template, setTemplate] = useState<TemplateConfig>(defaultTemplate)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cargar configuración del usuario
  const loadTemplate = async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.from("profiles").select("template_config").eq("id", user.id).single()

      if (error && error.code !== "PGRST116") throw error

      if (data?.template_config) {
        setTemplate({ ...defaultTemplate, ...data.template_config })
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Guardar configuración
  const saveTemplate = async (newTemplate: TemplateConfig) => {
    if (!user) throw new Error("Usuario no autenticado")

    setIsSaving(true)
    setError(null)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          template_config: newTemplate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      setTemplate(newTemplate)
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  // Actualizar template localmente y guardar automáticamente con debouncing
  const updateTemplate = async (updates: Partial<TemplateConfig>) => {
    const newTemplate = { ...template, ...updates }
    setTemplate(newTemplate)

    // Cancelar el timeout anterior si existe
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Programar guardado después de 2 segundos de inactividad
    saveTimeoutRef.current = setTimeout(() => {
      saveTemplate(newTemplate)
    }, 2000)
  }

  useEffect(() => {
    loadTemplate()
  }, [user])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    template,
    isLoading,
    isSaving,
    error,
    updateTemplate,
    saveTemplate,
    loadTemplate,
  }
}
