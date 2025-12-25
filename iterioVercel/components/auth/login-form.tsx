"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, LogIn, UserPlus, Mail } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { z } from "zod"

interface LoginFormProps {
  setView: (view: 'sign-in' | 'sign-up' | 'check-email') => void
}

const formSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres")
})

// Función para traducir errores de Supabase Auth al español
const translateAuthError = (errorMessage: string): string => {
  const errorTranslations: Record<string, string> = {
    'invalid login credentials': 'Credenciales inválidas. Verifica tu email y contraseña.',
    'invalid_credentials': 'Credenciales inválidas. Verifica tu email y contraseña.',
    'email not confirmed': 'Debes confirmar tu email antes de poder ingresar. Revisa tu bandeja de entrada.',
    'user not found': 'No existe una cuenta con este email.',
    'invalid password': 'Contraseña incorrecta.',
    'too many requests': 'Demasiados intentos. Por favor, espera unos minutos antes de intentar nuevamente.',
    'email already registered': 'Este email ya está registrado. Intenta iniciar sesión.',
    'signup disabled': 'El registro está deshabilitado temporalmente.',
    'password should be at least': 'La contraseña debe tener al menos 6 caracteres.',
    'unable to validate email address': 'El email ingresado no es válido.',
    'network': 'Error de conexión. Verifica tu internet e intenta nuevamente.',
  }
  
  const lowerMessage = errorMessage.toLowerCase()
  for (const [key, translation] of Object.entries(errorTranslations)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return translation
    }
  }
  return 'Error en la autenticación. Por favor, intenta nuevamente.'
}

export function LoginForm({ setView }: LoginFormProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const msg = localStorage.getItem('pendingApprovalMsg');
    const rejectedMsg = localStorage.getItem('rejectedMsg');
    if (msg) {
      setError(msg);
      localStorage.removeItem('pendingApprovalMsg');
    }
    if (rejectedMsg) {
      setError(rejectedMsg);
      localStorage.removeItem('rejectedMsg'); 
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")
    setIsLoading(true)

    try {
      // Solo login
      if (isLogin) {
        // Iniciar sesión
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setError(translateAuthError(error.message));
          return;
        }
        const user = data.user
        if (!user) {
          setError("No se pudo obtener el usuario");
          return;
        }

        // Buscar el perfil en la tabla 'profiles' usando el ID del usuario
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("is_approved, is_rejected")
          .eq("id", user.id)
          .single()

        if (profileError) {
          setError(profileError.message || "Error al obtener el perfil");
          return;
        }
        if (!profile) {
          setError("No se encontró el perfil");
          return;
        }

        // Si está rechazado, no permitir el acceso
        if (profile.is_rejected) {
          localStorage.setItem('rejectedMsg', "Tu solicitud de registro ha sido rechazada. Por favor, contacta al soporte.")
          await supabase.auth.signOut()
          return
        }

        // Si no está aprobado, cerrar sesión y mostrar mensaje amigable
        if (!profile.is_approved) {
          localStorage.setItem('pendingApprovalMsg', "Tu cuenta ya fue confirmada por email, pero aún está pendiente de aprobación por un administrador. Te avisaremos por correo cuando puedas ingresar.");
          await supabase.auth.signOut();
          return;
        }
        setMessage("¡Inicio de sesión exitoso!")
        setView('check-email')
      }
    } catch (error: any) {
      setError(error.message || "Error en la autenticación")
    } finally {
      setIsLoading(false)
    }
  }

  // Nueva función única para registro
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")
    setIsLoading(true)
    try {
      // Validación básica en front
      if (!email || !password || !fullName) {
        setError("Completa todos los campos.")
        return
      }
      // Llamar a la API de registro
      const response = await fetch('/api/auth/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName })
      })
      const result = await response.json()
      if (!response.ok) {
        if (response.status === 409) {
          setError(result.error || "El email ya está en uso.")
        } else {
          setError(result.error || "Error al crear la cuenta.")
        }
        return
      }
      setMessage("¡Cuenta creada! Por favor revisa tu email para confirmar tu cuenta.")
      setView('check-email')
    } catch (error: any) {
      setError(error.message || "Error en el registro.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!email) {
      setError("Ingresa tu email para restablecer la contraseña")
      return
    }

    setIsLoading(true)
    try {
      console.log("Enviando email de restablecimiento a:", email)
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        console.error("Error al enviar email:", error)
        throw error
      }

      console.log("Email enviado exitosamente:", data)
      setMessage("Se ha enviado un enlace de restablecimiento a tu email. Revisa tu bandeja de entrada y carpeta de spam.")
    } catch (error: any) {
      console.error("Error completo:", error)
      setError(error.message || "No se pudo enviar el email de restablecimiento. Por favor, intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#dcdce2] p-4 flex items-center justify-center p-4 relative overflow-hidden">
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
            {isLogin ? "Bienvenido a ITERIO" : "Únete a Iterio"}
          </CardTitle>
          <CardDescription className="text-slate-600 text-lg">
            {isLogin
              ? "¡Crea tus cotizaciones en minutos!"
              : "Crea cotizaciones increíbles para tus clientes"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={isLogin ? handleSubmit : handleSignUp} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-semibold text-slate-700">
                  Nombre completo
                </Label>
                <div className="relative">
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Tu nombre completo"
                    required={!isLogin}
                    className="pl-10 h-12 border-2 border-stone-200 focus:border-slate-600 transition-colors bg-stone-50/50 focus:bg-white"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                Email
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="pl-10 h-12 border-2 border-stone-200 focus:border-slate-600 transition-colors bg-stone-50/50 focus:bg-white"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  required
                  minLength={6}
                  className="pl-10 pr-12 h-12 border-2 border-stone-200 focus:border-slate-600 transition-colors bg-stone-50/50 focus:bg-white"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
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

            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-700">{message}</AlertDescription>
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
              ) : isLogin ? (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Iniciar Sesión
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Crear Cuenta
                </>
              )}
            </Button>
          </form>

          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-stone-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">O</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setIsLogin(!isLogin)
                setError("")
                setMessage("")
                setEmail("")
                setPassword("")
                setFullName("")
              }}
              className="w-full h-11 border-2 border-stone-300 hover:border-slate-400 hover:bg-stone-50 transition-colors text-slate-700"
            >
              {isLogin ? "¿No tienes cuenta? Crear una nueva" : "¿Ya tienes cuenta? Iniciar sesión"}
            </Button>

            {isLogin && (
              <Button
                variant="ghost"
                onClick={handleResetPassword}
                className="w-full text-sm text-slate-600 hover:text-slate-800 hover:bg-stone-50"
                disabled={isLoading}
              >
                <Mail className="h-4 w-4 mr-2" />
                ¿Olvidaste tu contraseña?
              </Button>
            )}
          </div>

          {/* Información sobre Supabase con diseño mejorado */}
          <div className="mt-8 p-4 bg-gradient-to-r from-stone-50 to-stone-100 rounded-xl border border-stone-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-800">Autenticación Segura con Supabase</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                <span>Verificación por email</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                <span>Sesiones seguras</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                <span>Recuperación de contraseña</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                <span>Datos encriptados</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
