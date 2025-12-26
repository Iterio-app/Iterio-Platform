"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [isCheckingTokens, setIsCheckingTokens] = useState(true)
  const [hasValidTokens, setHasValidTokens] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    // First, clear any existing session to ensure clean state
    const clearSession = async () => {
      await supabase.auth.signOut({ scope: 'global' })
    }
    
    clearSession()
    
    // Check if we're coming from the auth callback with recovery=true
    const isRecovery = searchParams.get('recovery') === 'true'
    
    if (isRecovery) {
      // Check for tokens in the hash
      const hash = window.location.hash.substring(1)
      const hashParams = new URLSearchParams(hash)
      
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')
      
      if (accessToken && type === 'recovery') {
        // Store tokens for later use (don't set session yet)
        setHasValidTokens(true)
      } else {
        setError("Enlace inválido o expirado. Por favor, solicita un nuevo restablecimiento de contraseña.")
      }
      
      setIsCheckingTokens(false)
      return
    }
    
    // Otherwise, try to get tokens from both hash and query parameters
    const hash = window.location.hash.substring(1)
    const hashParams = new URLSearchParams(hash)
    
    // Also check query parameters (in case they're there instead of hash)
    const queryParams = new URLSearchParams(window.location.search)
    
    // Get tokens from either hash or query params
    const accessToken = hashParams.get('access_token') || queryParams.get('access_token') || queryParams.get('code')
    const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token')
    const error = hashParams.get('error') || queryParams.get('error')
    const errorCode = hashParams.get('error_code') || queryParams.get('error_code')
    const errorDescription = hashParams.get('error_description') || queryParams.get('error_description')
    const type = hashParams.get('type') || queryParams.get('type')
    
    // Check for actual errors first
    if (error || errorCode) {
      // Handle error case
      const errorMsg = errorDescription || error || 'Error desconocido'
      setError(decodeURIComponent(errorMsg))
      setIsCheckingTokens(false)
      return
    }
    
    // If we have a code parameter, it might be the access token
    if (!accessToken && queryParams.get('code')) {
      // Try to use the code as access token
      const code = queryParams.get('code')
      // Don't require type=recovery if we have a code parameter
      if (!code) {
        setError("Enlace inválido. Por favor, solicita un nuevo restablecimiento de contraseña.")
        setIsCheckingTokens(false)
        return
      }
    }
    
    // Check if this is a password recovery flow (only if not using code parameter)
    if (!queryParams.get('code') && !type) {
      setError("Enlace inválido. Por favor, solicita un nuevo restablecimiento de contraseña.")
      setIsCheckingTokens(false)
      return
    }
    
    if (!accessToken && !queryParams.get('code')) {
      setError("Enlace inválido o expirado. Por favor, solicita un nuevo restablecimiento de contraseña.")
      setIsCheckingTokens(false)
      return
    }

    // Set the session with the tokens from the URL
    const setSession = async () => {
      let sessionError = null
      
      // Log for debugging
      console.log('Reset password - Tokens available:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasCode: !!queryParams.get('code'),
        url: window.location.href
      })

      // Try to set session with available tokens
      if (accessToken && refreshToken) {
        // If both tokens are present, set the session directly
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })
        if (error) {
          console.error('Error setting session with both tokens:', error)
          sessionError = error
        }
      } else if (accessToken) {
        // If only access token is available, try to set session directly
        // This works in production where tokens come in hash
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: ''
        })
        if (error) {
          console.error('Error setting session with access token only:', error)
          sessionError = error
        }
      } else if (queryParams.get('code')) {
        // If code is in query params, exchange it for session
        const code = queryParams.get('code')
        if (code) {
          console.log('Attempting to exchange code for session...')
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.error('Error exchanging code for session:', error)
            sessionError = error
          } else {
            console.log('Code exchanged successfully')
          }
        }
      } else {
        sessionError = new Error("No access token or refresh token found.")
      }
      
      if (sessionError) {
        console.error('Session setup failed:', sessionError)
        setError("Enlace inválido o expirado. Por favor, solicita un nuevo restablecimiento de contraseña.")
      }
      setIsCheckingTokens(false)
    }
    
    setSession()
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")
    setIsLoading(true)

    try {
      // Validar contraseñas
      if (password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres")
        return
      }

      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden")
        return
      }

      // Check if we have tokens to set the session first
      const isRecovery = searchParams.get('recovery') === 'true'
      if (isRecovery && hasValidTokens) {
        // Get tokens from hash and set session before updating password
        const hash = window.location.hash.substring(1)
        const hashParams = new URLSearchParams(hash)
        
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        
        if (accessToken) {
          console.log('Setting session before password update...')
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          })
          
          if (sessionError) {
            setError("Error al verificar la sesión. Por favor, solicita un nuevo restablecimiento de contraseña.")
            return
          }
        }
      }

      // Actualizar la contraseña
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setError(error.message)
        return
      }

      setIsSuccess(true)
      setMessage("¡Contraseña actualizada exitosamente!")
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        router.push("/")
      }, 2000)
      
    } catch (error: any) {
      setError(error.message || "Error al actualizar la contraseña")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#dcdce2] p-4 flex items-center justify-center relative overflow-hidden">
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 bg-[#fefffa]">
        <CardHeader className="text-center pb-8">
          <div className="mb-4">
            <img
              src="/images/logo-iterio.png"
              alt="Iterio Logo"
              className="h-[10rem] w-auto mx-auto rounded-xl"
            />
          </div>

          <CardTitle className="text-3xl font-bold text-slate-800 mb-2">
            {isSuccess ? "¡Contraseña Actualizada!" : "Restablecer Contraseña"}
          </CardTitle>
          <CardDescription className="text-slate-600 text-lg">
            {isSuccess 
              ? "Tu contraseña ha sido actualizada exitosamente"
              : "Ingresa tu nueva contraseña"
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {isCheckingTokens ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700"></div>
            </div>
          ) : !isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  Nueva Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu nueva contraseña"
                    required
                    minLength={6}
                    className="pl-10 pr-12 h-12 border-2 border-stone-200 focus:border-slate-600 transition-colors bg-stone-50/50 focus:bg-white"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-stone-100"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">
                  Confirmar Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirma tu nueva contraseña"
                    required
                    minLength={6}
                    className="pl-10 pr-12 h-12 border-2 border-stone-200 focus:border-slate-600 transition-colors bg-stone-50/50 focus:bg-white"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-stone-100"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    "Procesando..."
                  </div>
                ) : (
                  "Actualizar Contraseña"
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              {message && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-700">{message}</AlertDescription>
                </Alert>
              )}
              <p className="text-sm text-slate-600">
                Serás redirigido a la página de inicio de sesión...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
