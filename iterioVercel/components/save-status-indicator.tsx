"use client"

import { CheckCircle, AlertCircle } from "lucide-react"

interface SaveStatusIndicatorProps {
  isSaving: boolean
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  className?: string
}

export default function SaveStatusIndicator({ 
  isSaving, 
  lastSaved, 
  hasUnsavedChanges, 
  className = "" 
}: SaveStatusIndicatorProps) {
  if (!isSaving && !lastSaved && !hasUnsavedChanges) {
    return null
  }

  return (
    <div className={`w-full flex justify-center`}>
      <div className={`inline-flex items-center gap-4 bg-white/80 border border-gray-200 rounded-lg px-4 py-2 shadow-sm ${className}`}>
        {isSaving && (
          <span className="flex items-center gap-1 text-blue-600 font-medium text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Guardando...
          </span>
        )}
        {lastSaved && !isSaving && (
          <span className="flex items-center gap-1 text-green-600 font-medium text-sm">
            <CheckCircle className="h-4 w-4" />
            Último guardado:
            <span className="ml-1 px-2 py-0.5 rounded bg-green-50 text-green-700 font-mono text-xs">
              {lastSaved.toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
              })} - {lastSaved.toLocaleTimeString('es-ES', { hour12: false })}
            </span>
          </span>
        )}
        {hasUnsavedChanges && !isSaving && (
          <span className="flex items-center gap-1 text-orange-500 font-medium text-sm">
            <AlertCircle className="h-4 w-4" />
            Cambios sin guardar
          </span>
        )}
      </div>
    </div>
  )
} 