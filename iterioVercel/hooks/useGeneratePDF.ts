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
        
        // Eliminar el botón de imprimir antes de generar el PDF
        const printButton = doc.querySelector('.print-button')
        if (printButton) {
          printButton.remove()
          console.log('🗑️ Botón de imprimir eliminado del HTML')
        }
        
        const headHtml = doc.head?.innerHTML || ''
        const bodyHtml = doc.body?.innerHTML || ''
        contentHtml = `<html><head>${headHtml}</head><body>${bodyHtml}</body></html>`
      }

      onProgress?.('Cargando fuentes...')

      // Extraer el nombre de la fuente del HTML
      const fontFamilyMatch = contentHtml.match(/font-family:\s*'([^']+)'/)
      const fontFamily = fontFamilyMatch ? fontFamilyMatch[1] : 'Roboto'
      
      // Mapa de fuentes a URLs de Google Fonts (formato woff2)
      const fontUrlMap: Record<string, string> = {
        'Playfair Display': 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.woff2',
        'Roboto': 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2',
        'Open Sans': 'https://fonts.gstatic.com/s/opensans/v35/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVI.woff2',
        'Lato': 'https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjx4wXg.woff2',
        'Montserrat': 'https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw5aXo.woff2',
        'Poppins': 'https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2',
        'Raleway': 'https://fonts.gstatic.com/s/raleway/v28/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVvaorCIPrE.woff2',
        'Merriweather': 'https://fonts.gstatic.com/s/merriweather/v30/u-440qyriQwlOrhSvowK_l5-fCZM.woff2',
        'Nunito': 'https://fonts.gstatic.com/s/nunito/v25/XRXV3I6Li01BKofINeaE.woff2',
        'Ubuntu': 'https://fonts.gstatic.com/s/ubuntu/v20/4iCs6KVjbNBYlgo6eA.woff2',
      }

      // Descargar la fuente y convertirla a base64 para embeber en el HTML
      if (fontUrlMap[fontFamily]) {
        try {
          const fontUrl = fontUrlMap[fontFamily]
          console.log(`📥 Descargando fuente ${fontFamily} desde ${fontUrl}`)
          
          const response = await fetch(fontUrl)
          const fontBlob = await response.blob()
          
          // Convertir a base64
          const fontBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(fontBlob)
          })
          
          // Crear @font-face con la fuente embebida
          const fontFaceCSS = `
            @font-face {
              font-family: '${fontFamily}';
              src: url(${fontBase64}) format('woff2');
              font-weight: 100 900;
              font-style: normal;
              font-display: block;
            }
          `
          
          // Inyectar el @font-face en el HTML
          if (contentHtml.includes('<style>')) {
            contentHtml = contentHtml.replace('<style>', `<style>${fontFaceCSS}`)
          } else if (contentHtml.includes('</head>')) {
            contentHtml = contentHtml.replace('</head>', `<style>${fontFaceCSS}</style></head>`)
          }
          
          console.log(`✅ Fuente ${fontFamily} embebida en el HTML (${Math.round(fontBase64.length / 1024)}KB)`)
        } catch (fontError) {
          console.warn(`⚠️ No se pudo embeber la fuente ${fontFamily}:`, fontError)
        }
      }

      // Esperar un momento para que el navegador procese los estilos
      await new Promise(resolve => setTimeout(resolve, 300))

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
