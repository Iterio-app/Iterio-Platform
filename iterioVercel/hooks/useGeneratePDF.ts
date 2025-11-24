import { useState } from 'react'

// Importación dinámica de html2pdf.js para evitar problemas de SSR
// @ts-ignore - html2pdf.js no tiene tipos oficiales
const loadHtml2Pdf = () => import('html2pdf.js')

interface GeneratePDFOptions {
  filename?: string
  onProgress?: (stage: string) => void
}

interface GeneratePDFResult {
  blob: Blob | null
  error: string | null
  isGenerating: boolean
}

/**
 * Hook para generar PDFs desde HTML usando html2pdf.js
 * Mantiene la calidad y fidelidad del HTML original
 */
export function useGeneratePDF() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Genera un PDF desde HTML con configuración optimizada
   * para mantener la calidad del diseño
   */
  const generatePDF = async (
    html: string,
    options: GeneratePDFOptions = {}
  ): Promise<Blob | null> => {
    const { filename = 'cotizacion.pdf', onProgress } = options

    setIsGenerating(true)
    setError(null)

    try {
      onProgress?.('Preparando documento...')

      // Normalizar HTML: si viene un documento completo, extraer head y body
      let contentHtml = html
      if (html.includes('<html')) {
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        const headHtml = doc.head?.innerHTML || ''
        const bodyHtml = doc.body?.innerHTML || ''
        contentHtml = `<html><head>${headHtml}</head><body>${bodyHtml}</body></html>`
      }

      onProgress?.('Generando PDF...')

      // Configuración optimizada para html2pdf
      const opt = {
        margin: [8, 5, 8, 5], // [top, right, bottom, left] en mm
        filename,
        image: { 
          type: 'jpeg', 
          quality: 0.98 // Alta calidad para imágenes
        },
        html2canvas: {
          scale: 2, // Escala 2x para mejor resolución
          useCORS: true, // Permitir imágenes de otros dominios
          logging: false,
          letterRendering: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          imageTimeout: 15000, // 15 segundos para cargar imágenes
          removeContainer: true,
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
          compress: true, // Comprimir para reducir tamaño
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'], // Evitar cortes en medio de elementos
          before: '.page-break-before',
          after: '.page-break-after',
          avoid: ['.item-card', '.totals', '.validity-box', '.footer']
        },
      }

      // Cargar html2pdf dinámicamente
      const html2pdfModule = await loadHtml2Pdf()
      const html2pdf = html2pdfModule.default || html2pdfModule

      // Generar el PDF como blob usando HTML string directamente
      const worker = html2pdf()
        .set(opt)
        .from(contentHtml, 'string')
        .toPdf()

      const pdfBlob = await worker.get('pdf').then((pdf: any) => {
        // jsPDF expone el método output('blob') que devuelve un Blob válido de PDF
        return pdf.output('blob')
      })

      onProgress?.('PDF generado exitosamente')
      setIsGenerating(false)

      return pdfBlob as Blob
    } catch (err: any) {
      console.error('❌ Error generando PDF:', err)
      setError(err.message || 'Error desconocido al generar PDF')
      setIsGenerating(false)
      
      // Limpiar contenedor si existe
      const container = document.querySelector('div[style*="-9999px"]')
      if (container) {
        document.body.removeChild(container)
      }
      
      return null
    }
  }

  /**
   * Genera y descarga un PDF directamente
   */
  const generateAndDownload = async (
    html: string,
    filename: string = 'cotizacion.pdf',
    onProgress?: (stage: string) => void
  ): Promise<boolean> => {
    const blob = await generatePDF(html, { filename, onProgress })

    if (!blob) {
      return false
    }

    // Descargar el blob
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    return true
  }

  return {
    generatePDF,
    generateAndDownload,
    isGenerating,
    error,
  }
}
