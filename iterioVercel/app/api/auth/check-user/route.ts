import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if user exists in auth.users
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) {
      console.error('Error checking user:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const userExists = users.some(user => user.email?.toLowerCase() === email.toLowerCase())
    
    if (!userExists) {
      return NextResponse.json({ 
        exists: false,
        message: 'Este email no está registrado en nuestro sistema. Por favor, verifica que lo escribiste correctamente.'
      })
    }

    // Check if email is confirmed
    const user = users.find(user => user.email?.toLowerCase() === email.toLowerCase())
    
    return NextResponse.json({ 
      exists: true,
      emailConfirmed: user?.email_confirmed_at ? true : false,
      message: 'Email encontrado'
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
