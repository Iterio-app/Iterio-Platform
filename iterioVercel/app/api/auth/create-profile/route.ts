import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json()
    const supabase = createRouteHandlerClient({ cookies })
    const normalizedEmail = email.trim().toLowerCase()

    // 1. Registrar usuario usando el método público (envía email de confirmación automáticamente)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/pending-approval`,
        data: { full_name: fullName }
      }
    })

    if (signUpError || !signUpData?.user) {
      if (signUpError?.message?.toLowerCase().includes("registered")) {
        return new NextResponse(
          JSON.stringify({
            error: 'Ya existe una cuenta con este email. Por favor, inicia sesión o revisa tu bandeja de entrada.'
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        )
      }
      console.error('Error creating user in Auth:', signUpError)
      return new NextResponse(
        JSON.stringify({ error: signUpError?.message || 'No se pudo crear el usuario.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const userId = signUpData.user.id

    // 2. Insertar el perfil SOLO si el usuario se creó
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (profileCheckError) {
      console.error('Error checking existing profile:', profileCheckError)
      return new NextResponse(
        JSON.stringify({ error: 'Error verificando el perfil.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (existingProfile && Object.keys(existingProfile).length > 0) {
      // Si el perfil ya existe, retornar éxito (registro idempotente)
      return NextResponse.json({ success: true, profile: existingProfile })
    }

    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          email: normalizedEmail,
          full_name: fullName,
          role: 'user',
          is_approved: false,
          template_config: {
            logo: null,
            agencyName: 'Tu Agencia de Viajes',
            fontFamily: 'Inter',
            agencyEmail: 'info@tuagencia.com',
            agencyPhone: '+1 234 567 8900',
            primaryColor: '#2563eb',
            validityText: 'Esta cotización es válida por 15 días desde la fecha de emisión.',
            agencyAddress: 'Dirección de la agencia',
            secondaryColor: '#64748b'
          }
        }
      ])
      .select()
      .single()

    if (insertError) {
      // Si el error es por clave duplicada de email, retornar mensaje claro
      if (insertError.message && insertError.message.includes('duplicate key value violates unique constraint "profiles_email_key"')) {
        return new NextResponse(
          JSON.stringify({ error: 'Ya existe una cuenta con este email. Por favor, inicia sesión o cambia la contraseña.' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        )
      }
      console.error('Error creating profile:', insertError)
      return new NextResponse(
        JSON.stringify({ error: insertError.message || 'No se pudo crear el perfil. Intenta nuevamente.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // (Notificación a los admins deshabilitada temporalmente)
    // try {
    //   await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/notify-admin`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       userEmail: normalizedEmail,
    //       userName: fullName,
    //       note: 'Este usuario podría no haber confirmado su email aún. Solo aparecerá como pendiente en el panel de administración una vez que confirme su email.'
    //     }),
    //   })
    // } catch (mailError) {
    //   console.error('Error enviando notificación a admins:', mailError)
    //   // No hacer rollback, solo loguear
    // }

    return NextResponse.json({ success: true, profile: newProfile })
  } catch (error: any) {
    console.error('Error in create-profile route:', error)
    return new NextResponse(
      JSON.stringify({ error: error?.message || String(error) || 'Error interno al crear la cuenta.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}