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

// ✅ Cache global fuera del hook para persistir entre montajes
let templatesCache: Template[] = []
let lastTemplatesFetch = 0
let isFetchingTemplates = false // Flag para evitar fetches simultáneos
let cachedUserId: string | null = null // Track del usuario actual para invalidar cache al cambiar
const TEMPLATES_CACHE_DURATION = 30000 // 30 segundos

export function useTemplates(user: User | null) {
  const [templates, setTemplates] = useState<Template[]>(() => {
    // Solo usar cache si es del mismo usuario
    if (user && cachedUserId === user.id && templatesCache.length > 0) {
      return templatesCache
    }
    return []
  })
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
  const loadTemplates = async (force = false) => {
    if (!user) {
      setError({
        type: 'AUTH',
        message: 'Usuario no autenticado'
      })
      return
    }

    // ✅ Evitar fetches simultáneos
    if (isFetchingTemplates && !force) {
      console.log(`📋 Ya hay un fetch en progreso, esperando...`)
      return
    }

    // ✅ OPTIMIZACIÓN: Cache global para evitar re-fetches innecesarios
    const now = Date.now()
    const timeSinceLastFetch = now - lastTemplatesFetch
    
    if (!force && timeSinceLastFetch < TEMPLATES_CACHE_DURATION && templatesCache.length > 0) {
      console.log(`📋 Templates en cache (${Math.round(timeSinceLastFetch / 1000)}s desde última carga)`)
      setTemplates(templatesCache) // Asegurar que el estado local tenga el cache
      return
    }

    isFetchingTemplates = true
    setIsLoading(true)
    clearErrors()

    try {
      // ✅ OPTIMIZACIÓN: Solo traer campos necesarios para la lista
      // NO traer template_data completo (contiene logo en base64)
      const { data, error } = await supabase
        .from("templates")
        .select("id, user_id, name, created_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })

      if (error) throw error

      // Actualizar cache global y estado local
      templatesCache = (data || []) as Template[]
      cachedUserId = user.id // Guardar el ID del usuario actual
      lastTemplatesFetch = now
      setTemplates(templatesCache)
      
      console.log(`📋 Templates cargados: ${data?.length || 0} (sin template_data - optimizado)`)

      // Si hay templates, cargar el primero completo para usar como template actual
      if (data && data.length > 0) {
        await loadTemplateById(data[0].id)
      }
    } catch (err: any) {
      const templateError = handleSupabaseError(err)
      setError(templateError)
      console.error('Error loading templates:', templateError)
    } finally {
      isFetchingTemplates = false
      setIsLoading(false)
    }
  }

  // Cargar template completo por ID (con template_data)
  // Retorna el template completo para uso inmediato
  const loadTemplateById = async (id: string): Promise<Template | null> => {
    try {
      console.log(`📥 Cargando template completo: ${id}`)
      
      const { data, error } = await supabase
        .from("templates")
        .select("*") // Aquí sí traemos todo
        .eq("id", id)
        .eq("user_id", user!.id)
        .single()

      if (error) throw error
      
      if (data && data.template_data) {
        setCurrentTemplate({ ...defaultTemplate, ...data.template_data })
        console.log(`✅ Template completo cargado`)
        return data as Template
      }
      return null
    } catch (err: any) {
      console.error('Error loading template by ID:', err)
      return null
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

      // Actualizar cache global y estado local
      templatesCache = [...templatesCache, data]
      setTemplates(templatesCache)
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

      // Actualizar cache global y estado local
      templatesCache = templatesCache.map((template) => (template.id === id ? data : template))
      setTemplates(templatesCache)
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

      // Actualizar cache global y estado local
      templatesCache = templatesCache.filter((template) => template.id !== id)
      setTemplates(templatesCache)
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

  // Cambiar template actual (desde objeto Template completo)
  const setActiveTemplate = (template: Template) => {
    setCurrentTemplate({ ...defaultTemplate, ...template.template_data })
    clearErrors() // Limpiar errores al cambiar template
  }

  // Establecer template directamente desde TemplateConfig (para cargar desde cotizaciones guardadas)
  const setTemplateFromConfig = (config: TemplateConfig) => {
    setCurrentTemplate({ ...defaultTemplate, ...config })
    clearErrors()
  }

  // ✅ Sincronizar estado local con cache al montar
  // NO hacer fetch automático - se hará cuando el usuario vaya a la tab
  useEffect(() => {
    if (templatesCache.length > 0) {
      setTemplates(templatesCache)
      console.log(`📋 [useEffect] Sincronizando con cache (${templatesCache.length} templates)`)
    }
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
    loadTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    updateCurrentTemplate,
    setActiveTemplate,
    setTemplateFromConfig,
    clearErrors,
    validateTemplateConfig,
    validateTemplateName,
  }
}