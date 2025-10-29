import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
  try {
    console.log('🗑️ [DELETE-PDF] Iniciando eliminación de PDF...');
    
    const { pdfUrl } = await req.json();
    
    if (!pdfUrl) {
      return NextResponse.json({ success: false, error: 'PDF URL requerida' }, { status: 400 });
    }
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Credenciales de Supabase no configuradas');
      return NextResponse.json({ 
        success: false, 
        error: 'Credenciales de Supabase no configuradas' 
      }, { status: 500 });
    }
    
    // Extraer el path del archivo desde la URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/quotes-pdfs/user_id/quote_id.pdf
    const urlParts = pdfUrl.split('/quotes-pdfs/');
    if (urlParts.length < 2) {
      console.error('❌ URL de PDF inválida:', pdfUrl);
      return NextResponse.json({ success: false, error: 'URL de PDF inválida' }, { status: 400 });
    }
    
    const filePath = urlParts[1];
    console.log('📂 [DELETE-PDF] Path del archivo:', filePath);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Eliminar el archivo del bucket
    const { error } = await supabase.storage
      .from('quotes-pdfs')
      .remove([filePath]);
    
    if (error) {
      console.error('❌ [DELETE-PDF] Error al eliminar:', error);
      return NextResponse.json({ 
        success: false, 
        error: `Error al eliminar PDF: ${error.message}` 
      }, { status: 500 });
    }
    
    console.log('✅ [DELETE-PDF] PDF eliminado exitosamente');
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('❌ [DELETE-PDF] Error crítico:', error);
    return NextResponse.json({ 
      success: false, 
      error: `Error al eliminar PDF: ${error.message}` 
    }, { status: 500 });
  }
}
