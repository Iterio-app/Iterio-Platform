"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Upload, X, ImageIcon } from "lucide-react"
import { optimizeImage } from "@/lib/image-optimizer"

interface ImageUploadProps {
  id: string
  label: string
  image: string | null
  onImageChange: (image: string | null) => void
  className?: string
}

export default function ImageUpload({ id, label, image, onImageChange, className = "" }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const processFile = useCallback(
    (file: File) => {
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = async (e) => {
          const imageData = e.target?.result as string
          
          // Optimizar imagen antes de guardar
          try {
            const optimizedImage = await optimizeImage(imageData)
            onImageChange(optimizedImage)
          } catch (error) {
            console.error('Error al optimizar imagen:', error)
            // Si falla la optimización, usar imagen original
            onImageChange(imageData)
          }
        }
        reader.readAsDataURL(file)
      }
    },
    [onImageChange],
  )

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processFile(file)
    }
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

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find((file) => file.type.startsWith("image/"))

    if (imageFile) {
      processFile(imageFile)
    }
  }

  // Usar ref para mantener referencia estable del handler de paste
  const [isFocused, setIsFocused] = useState(false)
  const handlePasteRef = useRef<(e: ClipboardEvent) => void>(() => {})

  // Actualizar la ref cuando cambian las dependencias
  handlePasteRef.current = (e: ClipboardEvent) => {
    const items = Array.from(e.clipboardData?.items || [])
    const imageItem = items.find((item) => item.type.startsWith("image/"))

    if (imageItem) {
      const file = imageItem.getAsFile()
      if (file) {
        e.preventDefault()
        e.stopPropagation()
        processFile(file)
      }
    }
  }

  // Manejar el listener de paste con useEffect para limpieza correcta
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isFocused) {
        handlePasteRef.current(e)
      }
    }

    if (isFocused) {
      document.addEventListener("paste", handlePaste)
    }

    return () => {
      document.removeEventListener("paste", handlePaste)
    }
  }, [isFocused])

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
  }

  const removeImage = () => {
    onImageChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id}>{label}</Label>

      {image ? (
        <div className="relative">
          <img src={image || "/placeholder.svg"} alt={label} className="h-40 w-full object-cover rounded-md border" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full"
            onClick={removeImage}
            type="button"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          ref={dropZoneRef}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
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
                <Upload className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div className="text-sm text-gray-600">
              {isDragging ? (
                <p className="text-blue-600 font-medium">Suelta la imagen aquí</p>
              ) : (
                <div>
                  <p className="font-medium">Haz clic para subir imagen</p>
                  <p className="text-xs text-gray-500 mt-1">O arrastra y suelta, o pega con Ctrl+V</p>
                </div>
              )}
            </div>
          </div>

          <Input
            ref={fileInputRef}
            id={id}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}
    </div>
  )
}
