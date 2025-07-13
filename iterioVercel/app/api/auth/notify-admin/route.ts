import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userEmail, userName, note } = await request.json()
    console.log('notify-admin called with:', { userEmail, userName, note })
    const supabase = createRouteHandlerClient({ cookies })

    // Obtener emails de admins
    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select('email')
      .eq('role', 'admin')

    if (adminsError) throw adminsError

    // Enviar email a cada admin
    for (const admin of admins) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          },
          body: JSON.stringify({
            to: admin.email,
            subject: 'Nuevo usuario requiere aprobación',
            html: `
              <h2>Nuevo usuario requiere aprobación</h2>
              <p>El usuario ${userName} (${userEmail}) ha confirmado su registro y requiere aprobación para acceder al sistema.</p>
              ${note ? `<p style="color:#888;font-size:14px;">${note}</p>` : ''}
              <p>Por favor, ingresa al <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin">panel de administración</a> para aprobar o rechazar al usuario.</p>
            `,
          }),
        })
        const text = await response.text();
        console.log('Admin email response:', response.status, text)

        console.log('Notification sent to admin:', admin.email)
      } catch (error) {
        console.error('Error sending notification to admin:', admin.email, error)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in notify-admin route:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 