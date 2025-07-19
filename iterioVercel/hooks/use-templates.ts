"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

export interface TemplateConfig {
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

export interface Template {
  id: string
  user_id: string
  name: string
  template_data: TemplateConfig
  created_at: string
  updated_at: string
}

// Tipos específicos para errores
export interface TemplateError {
  type: 'AUTH' | 'NETWORK' | 'VALIDATION' | 'DATABASE' | 'UNKNOWN'
  message: string
  details?: string
  code?: string
}

export interface TemplateValidationError {
  field: keyof TemplateConfig | 'name'
  message: string
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

// Funciones de validación
const validateTemplateConfig = (config: Partial<TemplateConfig>): TemplateValidationError[] => {
  const errors: TemplateValidationError[] = []

  if (config.primaryColor && !/^#[0-9A-F]{6}$/i.test(config.primaryColor)) {
    errors.push({ field: 'primaryColor', message: 'Color primario debe ser un color hexadecimal válido' })
  }

  if (config.secondaryColor && !/^#[0-9A-F]{6}$/i.test(config.secondaryColor)) {
    errors.push({ field: 'secondaryColor', message: 'Color secundario debe ser un color hexadecimal válido' })
  }

  if (config.agencyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.agencyEmail)) {
    errors.push({ field: 'agencyEmail', message: 'Email de la agencia debe ser válido' })
  }

  if (config.agencyName && config.agencyName.trim().length < 2) {
    errors.push({ field: 'agencyName', message: 'Nombre de la agencia debe tener al menos 2 caracteres' })
  }

  return errors
}

const validateTemplateName = (name: string): TemplateValidationError[] => {
  const errors: TemplateValidationError[] = []

  if (!name || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'El nombre del template es requerido' })
  } else if (name.trim().length < 2) {
    errors.push({ field: 'name', message: 'El nombre debe tener al menos 2 caracteres' })
  } else if (name.trim().length > 50) {
    errors.push({ field: 'name', message: 'El nombre no puede exceder 50 caracteres' })
  }

  return errors
}

// Función para manejar errores de Supabase
const handleSupabaseError = (error: any): TemplateError => {
  if (error.code === 'PGRST116') {
    return {
      type: 'DATABASE',
      message: 'El template que intentas modificar o eliminar no existe o ya fue borrado.',
      code: error.code
    }
  }

  if (error.code === '23505') {
    return {
      type: 'VALIDATION',
      message: 'Ya existe un template con ese nombre',
      code: error.code
    }
  }

  if (error.code === '42501') {
    return {
      type: 'AUTH',
      message: 'No tienes permisos para realizar esta acción',
      code: error.code
    }
  }

  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return {
      type: 'NETWORK',
      message: 'Error de conexión. Verifica tu internet e intenta nuevamente',
      code: error.code
    }
  }

  return {
    type: 'UNKNOWN',
    message: error.message || 'Error inesperado',
    code: error.code
  }
}

export function useTemplates(user: User | null) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [currentTemplate, setCurrentTemplate] = useState<TemplateConfig>(defaultTemplate)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<TemplateError | null>(null)
  const [validationErrors, setValidationErrors] = useState<TemplateValidationError[]>([])
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Limpiar errores
  const clearErrors = () => {
    setError(null)
    setValidationErrors([])
  }

  // Cargar templates del usuario
  const loadTemplates = async () => {
    if (!user) {
      setError({
        type: 'AUTH',
        message: 'Usuario no autenticado'
      })
      return
    }

    setIsLoading(true)
    clearErrors()

    try {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })

      if (error) throw error

      setTemplates(data || [])

      // Si hay templates, usar el primero como template actual
      if (data && data.length > 0) {
        setCurrentTemplate({ ...defaultTemplate, ...data[0].template_data })
      }
    } catch (err: any) {
      const templateError = handleSupabaseError(err)
      setError(templateError)
      console.error('Error loading templates:', templateError)
    } finally {
      setIsLoading(false)
    }
  }

  // Crear nuevo template
  const createTemplate = async (name: string, templateData: TemplateConfig) => {
    if (!user) {
      const authError: TemplateError = {
        type: 'AUTH',
        message: 'Usuario no autenticado'
      }
      setError(authError)
      throw authError
    }

    // Validar nombre
    const nameErrors = validateTemplateName(name)
    if (nameErrors.length > 0) {
      setValidationErrors(nameErrors)
      throw new Error('Errores de validación en el nombre')
    }

    // Validar configuración
    const configErrors = validateTemplateConfig(templateData)
    if (configErrors.length > 0) {
      setValidationErrors(configErrors)
      throw new Error('Errores de validación en la configuración')
    }

    setIsSaving(true)
    clearErrors()

    try {
      const { data, error } = await supabase
        .from("templates")
        .insert({
          user_id: user.id,
          name: name.trim(),
          template_data: templateData,
        })
        .select()
        .single()

      if (error) throw error

      setTemplates((prev) => [...prev, data])
      return data
    } catch (err: any) {
      const templateError = handleSupabaseError(err)
      setError(templateError)
      console.error('Error creating template:', templateError)
      throw templateError
    } finally {
      setIsSaving(false)
    }
  }

  // Actualizar template existente
  const updateTemplate = async (id: string, updates: Partial<Template>) => {
    if (!user) {
      const authError: TemplateError = {
        type: 'AUTH',
        message: 'Usuario no autenticado'
      }
      setError(authError)
      throw authError
    }

    // Validar si hay cambios en el nombre
    if (updates.name) {
      const nameErrors = validateTemplateName(updates.name)
      if (nameErrors.length > 0) {
        setValidationErrors(nameErrors)
        throw new Error('Errores de validación en el nombre')
      }
    }

    // Validar si hay cambios en la configuración
    if (updates.template_data) {
      const configErrors = validateTemplateConfig(updates.template_data)
      if (configErrors.length > 0) {
        setValidationErrors(configErrors)
        throw new Error('Errores de validación en la configuración')
      }
    }

    setIsSaving(true)
    clearErrors()

    try {
      const { data, error } = await supabase
        .from("templates")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single()

      if (error) throw error

      setTemplates((prev) => prev.map((template) => (template.id === id ? data : template)))
      return data
    } catch (err: any) {
      const templateError = handleSupabaseError(err)
      setError(templateError)
      console.error('Error updating template:', templateError)
      throw templateError
    } finally {
      setIsSaving(false)
    }
  }

  // Eliminar template
  const deleteTemplate = async (id: string) => {
    if (!user) {
      const authError: TemplateError = {
        type: 'AUTH',
        message: 'Usuario no autenticado'
      }
      setError(authError)
      throw authError
    }

    clearErrors()

    try {
      const { error } = await supabase
        .from("templates")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)

      if (error) throw error

      setTemplates((prev) => prev.filter((template) => template.id !== id))
    } catch (err: any) {
      const templateError = handleSupabaseError(err)
      setError(templateError)
      console.error('Error deleting template:', templateError)
      throw templateError
    }
  }

  // Actualizar template actual con debouncing
  const updateCurrentTemplate = async (updates: Partial<TemplateConfig>) => {
    const newTemplate = { ...currentTemplate, ...updates }
    setCurrentTemplate(newTemplate)

    // Cancelar el timeout anterior si existe
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Programar guardado después de 2 segundos de inactividad
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        // Si hay templates, actualizar el primero (template principal)
        if (templates.length > 0) {
          await updateTemplate(templates[0].id, { template_data: newTemplate })
        } else {
          // Si no hay templates, crear uno nuevo
          await createTemplate("Template Principal", newTemplate)
        }
      } catch (err) {
        // Los errores ya se manejan en las funciones individuales
        console.error('Error in auto-save:', err)
      }
    }, 2000)
  }

  // Cambiar template actual
  const setActiveTemplate = (template: Template) => {
    setCurrentTemplate({ ...defaultTemplate, ...template.template_data })
    clearErrors() // Limpiar errores al cambiar template
  }

  // Cargar templates al montar el componente
  useEffect(() => {
    loadTemplates()
  }, [user])

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    templates,
    currentTemplate,
    isLoading,
    isSaving,
    error,
    validationErrors,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    updateCurrentTemplate,
    setActiveTemplate,
    clearErrors,
    validateTemplateConfig,
    validateTemplateName,
  }
} 