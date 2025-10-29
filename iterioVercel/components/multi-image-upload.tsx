"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Upload, X, ImageIcon, Plus } from "lucide-react"
import { optimizeImage } from "@/lib/image-optimizer"

interface MultiImageUploadProps {
  id: string
  label: string
  images: string[]
  onImagesChange: (images: string[]) => void
  className?: string
  maxImages?: number
}

export default function MultiImageUpload({
  id,
  label,
  images,
  onImagesChange,
  className = "",
  maxImages = 5,
}: MultiImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const processFiles = useCallback(
    (files: FileList) => {
      const newImages: string[] = []
      const remainingSlots = maxImages - images.length
      const filesToProcess = Math.min(files.length, remainingSlots)

      let processedCount = 0

      for (let i = 0; i < filesToProcess; i++) {
        const file = files[i]
        if (file && file.type.startsWith("image/")) {
          const reader = new FileReader()
          reader.onload = async (e) => {
            const imageData = e.target?.result as string
            
            // Optimizar imagen antes de guardar
            try {
              const optimizedImage = await optimizeImage(imageData)
              newImages.push(optimizedImage)
            } catch (error) {
              console.error('Error al optimizar imagen:', error)
              // Si falla la optimización, usar imagen original
              newImages.push(imageData)
            }
            
            processedCount++

            if (processedCount === filesToProcess) {
              onImagesChange([...images, ...newImages])
            }
          }
          reader.readAsDataURL(file)
        }
      }
    },
    [images, onImagesChange, maxImages],
  )

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      processFiles(files)
    }
    // Reset input value to allow selecting the same files again
    event.target.value = ""
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFiles(files)
    }
  }

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || [])
      const imageItems = items.filter((item) => item.type.startsWith("image/"))

      if (imageItems.length > 0 && images.length < maxImages) {
        const file = imageItems[0].getAsFile()
        if (file) {
          const reader = new FileReader()
          reader.onload = async (e) => {
            const imageData = e.target?.result as string
            
            // Optimizar imagen antes de guardar
            try {
              const optimizedImage = await optimizeImage(imageData)
              onImagesChange([...images, optimizedImage])
            } catch (error) {
              console.error('Error al optimizar imagen:', error)
              // Si falla la optimización, usar imagen original
              onImagesChange([...images, imageData])
            }
          }
          reader.readAsDataURL(file)
        }
      }
    },
    [images, onImagesChange, maxImages],
  )

  // Agregar event listener para paste cuando el componente está enfocado
  const handleFocus = () => {
    document.addEventListener("paste", handlePaste)
  }

  const handleBlur = () => {
    document.removeEventListener("paste", handlePaste)
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const canAddMore = images.length < maxImages

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id}>
        {label} {images.length > 0 && `(${images.length}/${maxImages})`}
      </Label>

      {/* Mostrar imágenes existentes */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image || "/placeholder.svg"}
                alt={`${label} ${index + 1}`}
                className="h-32 w-full object-cover rounded-md border border-gray-200"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
                type="button"
              >
                <X className="h-3 w-3" />
              </Button>
              <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zona de subida */}
      {canAddMore && (
        <div
          ref={dropZoneRef}
          className={`
            border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
            ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
          onFocus={handleFocus}
          onBlur={handleBlur}
          tabIndex={0}
        >
          <div className="space-y-2">
            <div className="flex justify-center">
              {isDragging ? (
                <ImageIcon className="h-8 w-8 text-blue-500" />
              ) : (
                <div className="flex items-center gap-2">
                  <Upload className="h-6 w-6 text-gray-400" />
                  <Plus className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>
            <div className="text-sm text-gray-600">
              {isDragging ? (
                <p className="text-blue-600 font-medium">Suelta las imágenes aquí</p>
              ) : (
                <div>
                  <p className="font-medium">
                    {images.length === 0 ? "Haz clic para subir imágenes" : "Agregar más imágenes"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Arrastra y suelta, pega con Ctrl+V, o selecciona múltiples archivos
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Máximo {maxImages} imágenes</p>
                </div>
              )}
            </div>
          </div>

          <Input
            ref={fileInputRef}
            id={id}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {!canAddMore && (
        <div className="text-center p-3 bg-gray-50 rounded-lg border">
          <p className="text-sm text-gray-600">Máximo de {maxImages} imágenes alcanzado</p>
        </div>
      )}
    </div>
  )
}
