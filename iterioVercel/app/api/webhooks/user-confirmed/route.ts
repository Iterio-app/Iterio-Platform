import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const event = await request.json()
    if (event.type !== 'user.confirmed') {
      return NextResponse.json({ ok: true }) // Ignora otros eventos
    }

    const { email, user_metadata } = event.record
    const fullName = user_metadata?.full_name || email

    // Notificar a los admins reutilizando el endpoint existente
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/notify-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: email,
        userName: fullName,
      }),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in user-confirmed webhook:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 