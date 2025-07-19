import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

// Usa las variables de entorno correctas para backend (sin NEXT_PUBLIC_)
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    // 1. Parsear el body para obtener datos y HTML
    const { quoteId, html } = await req.json();
    if (!html || !quoteId) {
      return NextResponse.json({ success: false, error: 'HTML y quoteId requeridos' }, { status: 400 });
    }

    // 2. Generar el PDF con Puppeteer
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html);
    const pdfBuffer = await page.pdf({ 
      format: 'A4', 
      printBackground: true,
      margin: {
        top: '10mm',
        right: '5mm',
        bottom: '10mm',
        left: '5mm'
      }
    });
    await browser.close();

    // 3. Subir el PDF a Supabase Storage
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const fecha = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = `${quoteId}_${fecha}.pdf`;
    // Subir como archivo nuevo (no sobrescribe)
    const { error: uploadError } = await supabase.storage.from('quotes-pdfs').upload(filePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: false,
    });
    if (uploadError) {
      console.error('Error al subir PDF a Storage:', uploadError);
      return NextResponse.json({ success: false, error: 'Error al subir PDF a Storage' }, { status: 500 });
    }

    // 4. Obtener la URL pública
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/quotes-pdfs/${filePath}`;

    // 5. Actualizar la base de datos
    const { error: updateError } = await supabase
      .from('quotes')
      .update({ pdf_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', quoteId);
    if (updateError) {
      console.error('Error al actualizar la base de datos:', updateError);
      return NextResponse.json({ success: false, error: 'Error al actualizar la base de datos' }, { status: 500 });
    }

    // 6. Devolver la URL pública del PDF
    return NextResponse.json({ success: true, pdfUrl: publicUrl });
  } catch (error) {
    console.error('Error al generar/guardar PDF:', error);
    return NextResponse.json({ success: false, error: 'Error al generar/guardar PDF' }, { status: 500 });
  }
} 