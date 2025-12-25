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
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    // Verificar si tenemos el token en la URL
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    
    if (!accessToken || !refreshToken) {
      setError("Enlace inválido o expirado. Por favor, solicita un nuevo restablecimiento de contraseña.")
      return
    }

    // Establecer la sesión con los tokens de la URL
    const setSession = async () => {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })
      
      if (error) {
        setError("Enlace inválido o expirado. Por favor, solicita un nuevo restablecimiento de contraseña.")
      }
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
          {!isSuccess ? (
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
