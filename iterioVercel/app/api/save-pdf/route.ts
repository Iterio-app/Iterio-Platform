import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Variables de entorno para Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
  })
}

/**
 * API Route para subir PDF generado en el cliente a Supabase Storage
 * 
 * El PDF ya viene generado desde el cliente usando html2pdf.js
 * Este endpoint solo se encarga de:
 * 1. Recibir el PDF como base64
 * 2. Subirlo a Supabase Storage
 * 3. Actualizar la URL en la base de datos
 * 4. Retornar la URL pública
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const timings: Record<string, number> = {}

  try {
    console.log('🚀 [SAVE-PDF] Iniciando proceso de guardado...')
    console.log('📍 [SAVE-PDF] Entorno:', process.env.VERCEL_ENV || 'development')

    // 1. Parsear el body
    const parseStart = Date.now()
    const { quoteId, pdfBase64 } = await req.json()
    timings.parse = Date.now() - parseStart

    if (!pdfBase64 || !quoteId) {
      console.error('❌ [SAVE-PDF] Datos faltantes:', {
        hasPdf: !!pdfBase64,
        hasQuoteId: !!quoteId,
      })
      return NextResponse.json(
        { success: false, error: 'PDF y quoteId requeridos' },
        { status: 400 }
      )
    }

    console.log('✅ [SAVE-PDF] Datos recibidos:', {
      quoteId,
      pdfSize: pdfBase64.length,
    })
    console.log('⏱️  [SAVE-PDF] Parse time:', timings.parse, 'ms')

    // 2. Convertir base64 a Buffer
    const convertStart = Date.now()
    const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '')
    const pdfBuffer = Buffer.from(base64Data, 'base64')
    timings.convert = Date.now() - convertStart

    console.log('✅ [SAVE-PDF] PDF convertido a buffer:', pdfBuffer.length, 'bytes')
    console.log('⏱️  [SAVE-PDF] Convert time:', timings.convert, 'ms')

    // 3. Verificar credenciales de Supabase
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ [SAVE-PDF] Credenciales de Supabase no configuradas')
      return NextResponse.json(
        {
          success: false,
          error: 'Credenciales de Supabase no configuradas en el servidor',
        },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 4. Verificar si ya existe un PDF para esta cotización y eliminarlo
    const cleanupStart = Date.now()
    const { data: existingQuote } = await supabase
      .from('quotes')
      .select('pdf_url')
      .eq('id', quoteId)
      .single()

    if (existingQuote?.pdf_url) {
      try {
        const oldUrlParts = existingQuote.pdf_url.split('/quotes-pdfs/')
        if (oldUrlParts.length >= 2) {
          const oldFilePath = oldUrlParts[1]
          console.log('🗑️  [SAVE-PDF] Eliminando PDF viejo:', oldFilePath)

          const { error: deleteError } = await supabase.storage
            .from('quotes-pdfs')
            .remove([oldFilePath])

          if (deleteError) {
            console.warn('⚠️  [SAVE-PDF] No se pudo eliminar PDF viejo:', deleteError.message)
          } else {
            console.log('✅ [SAVE-PDF] PDF viejo eliminado')
          }
        }
      } catch (error) {
        console.warn('⚠️  [SAVE-PDF] Error al eliminar PDF viejo:', error)
        // Continuar con la subida del nuevo PDF
      }
    }
    timings.cleanup = Date.now() - cleanupStart
    console.log('⏱️  [SAVE-PDF] Cleanup time:', timings.cleanup, 'ms')

    // 5. Subir el nuevo PDF a Supabase Storage
    const uploadStart = Date.now()
    const fecha = new Date().toISOString().replace(/[:.]/g, '-')
    const filePath = `${quoteId}_${fecha}.pdf`

    console.log('📤 [SAVE-PDF] Subiendo archivo:', filePath)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('quotes-pdfs')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      console.error('❌ [SAVE-PDF] Error al subir PDF:', uploadError)
      return NextResponse.json(
        {
          success: false,
          error: `Error al subir PDF: ${uploadError.message}`,
        },
        { status: 500 }
      )
    }

    timings.upload = Date.now() - uploadStart
    console.log('✅ [SAVE-PDF] PDF subido exitosamente:', uploadData)
    console.log('⏱️  [SAVE-PDF] Upload time:', timings.upload, 'ms')

    // 6. Generar URL pública
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/quotes-pdfs/${filePath}`
    console.log('🔗 [SAVE-PDF] URL pública:', publicUrl)

    // 7. Actualizar la base de datos
    const dbStart = Date.now()
    console.log('💾 [SAVE-PDF] Actualizando base de datos...')

    const { error: updateError } = await supabase
      .from('quotes')
      .update({ pdf_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', quoteId)

    if (updateError) {
      console.error('❌ [SAVE-PDF] Error al actualizar BD:', updateError)
      return NextResponse.json(
        {
          success: false,
          error: `Error al actualizar BD: ${updateError.message}`,
        },
        { status: 500 }
      )
    }

    timings.db = Date.now() - dbStart
    console.log('✅ [SAVE-PDF] Base de datos actualizada')
    console.log('⏱️  [SAVE-PDF] DB update time:', timings.db, 'ms')

    // 8. Retornar respuesta exitosa
    timings.total = Date.now() - startTime
    console.log('🎉 [SAVE-PDF] Proceso completado exitosamente')
    console.log('⏱️  [SAVE-PDF] TOTAL TIME:', timings.total, 'ms')
    console.log('📊 [SAVE-PDF] Desglose:', JSON.stringify(timings, null, 2))

    return NextResponse.json({
      success: true,
      pdfUrl: publicUrl,
      timings: process.env.NODE_ENV === 'development' ? timings : undefined,
    })
  } catch (error: any) {
    console.error('❌ [SAVE-PDF] Error crítico:', error)
    console.error('Stack trace:', error.stack)

    return NextResponse.json(
      {
        success: false,
        error: `Error al guardar PDF: ${error.message}`,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
} 