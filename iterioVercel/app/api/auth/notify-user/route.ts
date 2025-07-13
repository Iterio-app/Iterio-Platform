import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userEmail } = await request.json()

    // Enviar email al usuario usando el servicio de email de Supabase
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      },
      body: JSON.stringify({
        to: userEmail,
        subject: '¡Tu cuenta ha sido aprobada!',
        html: `
          <h2>¡Bienvenido a Iterio!</h2>
          <p>Tu cuenta ha sido aprobada por un administrador.</p>
          <p>Ya puedes ingresar a <a href="${process.env.NEXT_PUBLIC_SITE_URL}">Iterio</a> y comenzar a crear cotizaciones.</p>
        `,
      }),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in notify-user route:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 