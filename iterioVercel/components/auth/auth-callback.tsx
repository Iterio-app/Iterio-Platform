"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Check for tokens in the URL hash (implicit flow)
      const hash = window.location.hash.substring(1)
      const hashParams = new URLSearchParams(hash)
      
      // Get tokens from hash
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const error = hashParams.get('error') || searchParams.get('error')
      const errorDescription = hashParams.get('error_description') || searchParams.get('error_description')
      const type = hashParams.get('type') || searchParams.get('type')

      if (error) {
        setError(decodeURIComponent(errorDescription || error))
        setLoading(false)
        return
      }

      if (accessToken) {
        try {
          // Check if this is a password recovery flow
          if (type === 'recovery') {
            // For recovery, DON'T set the session yet
            // Just redirect to the reset password page with the tokens
            const url = new URL('/auth/reset-password', window.location.origin)
            url.searchParams.set('recovery', 'true')
            // Pass the tokens in the URL hash for the reset page to use
            url.hash = `#access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken || '')}&type=recovery`
            router.push(url.toString())
          } else {
            // For other flows (e.g., email confirmation), set the session and redirect to home
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            })
            
            if (error) {
              setError(error.message)
              setLoading(false)
              return
            }
            router.push('/')
          }
        } catch (err: any) {
          setError(err.message)
        }
      } else {
        // Check if we're at the root with tokens (direct redirect from email)
        if (window.location.pathname === '/' && hashParams.get('access_token')) {
          // We're at the root page but with auth tokens in hash
          // This means the email linked directly to the home page
          // Let's handle it here
          window.location.hash = ''
          router.push('/')
        } else {
          setError('No access token found')
        }
      }
      
      setLoading(false)
    }

    // Small delay to ensure the hash is available
    setTimeout(handleAuthCallback, 100)
  }, [router, searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#dcdce2] flex items-center justify-center">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-[#fefffa]">
          <CardHeader className="text-center pb-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700 mx-auto"></div>
            <p className="text-slate-600">Procesando autenticación...</p>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#dcdce2] flex items-center justify-center">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-[#fefffa]">
          <CardHeader className="text-center pb-8">
            <h2 className="text-2xl font-bold text-red-600">Error de Autenticación</h2>
            <p className="text-slate-600">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-800"
            >
              Volver al inicio
            </button>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return null
}
