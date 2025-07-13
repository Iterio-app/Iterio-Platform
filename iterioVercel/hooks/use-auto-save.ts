import { useState, useEffect, useCallback, useRef } from 'react'

interface UseAutoSaveOptions {
  delay?: number
  enabled?: boolean
}

export function useAutoSave<T>(
  data: T,
  saveFunction: (data: T, isAutoSave?: boolean) => Promise<void>,
  options: UseAutoSaveOptions = {}
) {
  const { delay = 3000, enabled = true } = options
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastDataRef = useRef<T>(data)

  const markAsChanged = useCallback(() => {
    setHasUnsavedChanges(true)
    
    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Auto-guardar después del delay especificado
    timeoutRef.current = setTimeout(async () => {
      if (hasUnsavedChanges && enabled) {
        try {
          setIsSaving(true)
          await saveFunction(data, true) // true = auto-save
          setLastSaved(new Date())
          setHasUnsavedChanges(false)
        } catch (error) {
          console.error('Auto-save failed:', error)
        } finally {
          setIsSaving(false)
        }
      }
    }, delay)
  }, [data, saveFunction, delay, hasUnsavedChanges, enabled])

  const manualSave = useCallback(async () => {
    try {
      setIsSaving(true)
      await saveFunction(data, false) // false = manual save
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Manual save failed:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }, [data, saveFunction])

  // Detectar cambios en los datos
  useEffect(() => {
    if (JSON.stringify(data) !== JSON.stringify(lastDataRef.current)) {
      lastDataRef.current = data
      if (enabled) {
        markAsChanged()
      }
    }
  }, [data, markAsChanged, enabled])

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    manualSave,
    markAsChanged
  }
} 