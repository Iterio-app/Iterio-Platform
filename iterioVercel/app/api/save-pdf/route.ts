import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usa las variables de entorno correctas para backend
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes:', { 
    hasUrl: !!supabaseUrl, 
    hasServiceKey: !!supabaseServiceKey 
  });
}

export async function POST(req: NextRequest) {
  let browser;
  const timings: Record<string, number> = {};
  const startTime = Date.now();
  
  try {
    console.log('🚀 Iniciando generación de PDF...');
    console.log('📍 Entorno:', process.env.VERCEL_ENV || 'development');
    
    // 1. Parsear el body para obtener datos y HTML
    const parseStart = Date.now();
    const { quoteId, html } = await req.json();
    timings.parse = Date.now() - parseStart;
    if (!html || !quoteId) {
      console.error('❌ Datos faltantes:', { hasHtml: !!html, hasQuoteId: !!quoteId });
      return NextResponse.json({ success: false, error: 'HTML y quoteId requeridos' }, { status: 400 });
    }

    console.log('✅ Datos recibidos:', { quoteId, htmlLength: html.length });
    console.log('⏱️  Parse time:', timings.parse, 'ms');

    // 2. Generar el PDF con Puppeteer
    console.log('🌐 Lanzando navegador...');
    const launchStart = Date.now();
    
    const isProduction = process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview';
    console.log('🔍 Entorno detectado:', isProduction ? 'PRODUCCIÓN' : 'DESARROLLO');
    
    // Importación dinámica según el entorno
    let puppeteer: any;
    
    if (isProduction) {
      puppeteer = await import('puppeteer-core');
      console.log('📦 Usando puppeteer-core para producción');
    } else {
      puppeteer = await import('puppeteer');
      console.log('📦 Usando puppeteer para desarrollo');
    }
    
    // Args optimizados para reducir tiempo de launch
    const baseArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // Usa /tmp en lugar de /dev/shm
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-sync',
      '--no-first-run',
    ];
    
    if (isProduction) {
      // Configuración para Vercel con Chromium desde chrome-aws-lambda layer
      console.log('🔧 Configurando Chromium para producción con Vercel native support...');
      
      // Usar chrome-aws-lambda que viene preinstalado en Vercel
      let chromium: any;
      try {
        // @ts-ignore - chrome-aws-lambda no tiene definiciones de tipos
        chromium = await import('chrome-aws-lambda');
        console.log('✅ chrome-aws-lambda importado correctamente');
      } catch (error: any) {
        console.error('❌ Error importando chrome-aws-lambda:', error);
        throw new Error('chrome-aws-lambda no disponible en Vercel');
      }
      
      const productionArgs = [
        ...baseArgs,
        ...chromium.args,
        '--no-zygote',
        '--single-process',
      ];
      
      console.log('🚀 Lanzando Chromium...');
      
      try {
        browser = await puppeteer.default.launch({
          args: productionArgs,
          executablePath: await chromium.executablePath,
          headless: chromium.headless,
          ignoreHTTPSErrors: true,
          defaultViewport: {
            width: 1920,
            height: 1080,
          },
        });
        console.log('✅ Browser lanzado exitosamente');
      } catch (error: any) {
        console.error('❌ Error lanzando browser:', error);
        throw new Error(`Error al lanzar Chromium: ${error?.message || 'Unknown error'}`);
      }
    } else {
      // Configuración para desarrollo local (Windows/Mac)
      console.log('🔧 Configurando Puppeteer para desarrollo local...');
      browser = await puppeteer.default.launch({ 
        args: baseArgs,
        headless: true
      });
    }
    timings.launch = Date.now() - launchStart;
    
    console.log('✅ Navegador lanzado');
    console.log('⏱️  Launch time:', timings.launch, 'ms');
    
    const pageStart = Date.now();
    const page = await browser.newPage();
    timings.newPage = Date.now() - pageStart;
    console.log('📄 Página creada, configurando contenido...');
    console.log('⏱️  New page time:', timings.newPage, 'ms');
    
    const setContentStart = Date.now();
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });
    timings.setContent = Date.now() - setContentStart;
    console.log('✅ Contenido HTML cargado');
    console.log('⏱️  SetContent time:', timings.setContent, 'ms');
    
    const pdfStart = Date.now();
    const pdfBuffer = await page.pdf({ 
      format: 'A4', 
      printBackground: true,
      margin: {
        top: '10mm',
        right: '5mm',
        bottom: '10mm',
        left: '5mm'
      },
      preferCSSPageSize: false,
      omitBackground: false,
      scale: 0.95, // Reduce tamaño sin perder calidad visible
      timeout: 30000
    });
    timings.pdf = Date.now() - pdfStart;
    console.log('✅ PDF generado, tamaño:', pdfBuffer.length, 'bytes');
    console.log('⏱️  PDF generation time:', timings.pdf, 'ms');
    
    // Cerrar navegador en background (no bloqueante)
    const closeStart = Date.now();
    const closePromise = browser.close().then(() => {
      timings.close = Date.now() - closeStart;
      console.log('✅ Navegador cerrado');
      console.log('⏱️  Close time:', timings.close, 'ms');
    }).catch((err: any) => {
      console.error('⚠️ Error al cerrar navegador:', err);
      timings.close = Date.now() - closeStart;
    });

    // 3. Subir el PDF a Supabase Storage
    console.log('☁️ Subiendo PDF a Supabase Storage...');
    const uploadStart = Date.now();
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Credenciales de Supabase no configuradas');
      return NextResponse.json({ 
        success: false, 
        error: 'Credenciales de Supabase no configuradas en el servidor' 
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verificar si ya existe un PDF para esta cotización
    const { data: existingQuote } = await supabase
      .from('quotes')
      .select('pdf_url')
      .eq('id', quoteId)
      .single();
    
    // Si existe un PDF viejo, eliminarlo del bucket
    if (existingQuote?.pdf_url) {
      try {
        const oldUrlParts = existingQuote.pdf_url.split('/quotes-pdfs/');
        if (oldUrlParts.length >= 2) {
          const oldFilePath = oldUrlParts[1];
          console.log('🗑️ Eliminando PDF viejo del bucket:', oldFilePath);
          
          const { error: deleteError } = await supabase.storage
            .from('quotes-pdfs')
            .remove([oldFilePath]);
          
          if (deleteError) {
            console.warn('⚠️ No se pudo eliminar PDF viejo:', deleteError.message);
          } else {
            console.log('✅ PDF viejo eliminado');
          }
        }
      } catch (error) {
        console.warn('⚠️ Error al eliminar PDF viejo:', error);
        // Continuar con la subida del nuevo PDF
      }
    }
    
    const fecha = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = `${quoteId}_${fecha}.pdf`;
    
    console.log('📤 Subiendo archivo nuevo:', filePath);
    
    // Subir como archivo nuevo (no sobrescribe)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('quotes-pdfs')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });
      
    if (uploadError) {
      console.error('❌ Error al subir PDF a Storage:', uploadError);
      return NextResponse.json({ 
        success: false, 
        error: `Error al subir PDF: ${uploadError.message}` 
      }, { status: 500 });
    }
    
    timings.upload = Date.now() - uploadStart;
    console.log('✅ PDF subido exitosamente:', uploadData);
    console.log('⏱️  Upload time:', timings.upload, 'ms');

    // 4. Obtener la URL pública
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/quotes-pdfs/${filePath}`;
    console.log('🔗 URL pública generada:', publicUrl);

    // 5. Actualizar la base de datos
    console.log('💾 Actualizando base de datos...');
    const dbStart = Date.now();
    const { error: updateError } = await supabase
      .from('quotes')
      .update({ pdf_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', quoteId);
      
    if (updateError) {
      console.error('❌ Error al actualizar la base de datos:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: `Error al actualizar BD: ${updateError.message}` 
      }, { status: 500 });
    }
    
    timings.db = Date.now() - dbStart;
    console.log('✅ Base de datos actualizada');
    console.log('⏱️  DB update time:', timings.db, 'ms');

    // 6. Esperar a que el navegador termine de cerrar
    await closePromise;
    
    // 7. Devolver la URL pública del PDF
    timings.total = Date.now() - startTime;
    console.log('🎉 Proceso completado exitosamente');
    console.log('⏱️  TOTAL TIME:', timings.total, 'ms');
    console.log('📊 Desglose:', JSON.stringify(timings, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      pdfUrl: publicUrl,
      timings: process.env.NODE_ENV === 'development' ? timings : undefined
    });
  } catch (error: any) {
    console.error('❌ Error crítico al generar/guardar PDF:', error);
    console.error('Stack trace:', error.stack);
    
    // Cerrar navegador si quedó abierto
    if (browser) {
      try {
        await browser.close();
        console.log('🧹 Navegador cerrado después del error');
      } catch (closeError) {
        console.error('Error al cerrar navegador:', closeError);
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      error: `Error al generar/guardar PDF: ${error.message}`,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
} 