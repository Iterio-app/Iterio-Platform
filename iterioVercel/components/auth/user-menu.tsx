"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings, FileText, Save, Shield, PlusCircle, ListChecks, Layout } from "lucide-react"
import { supabase, type Profile } from "@/lib/supabase"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { useRouter } from 'next/navigation'
import { Switch } from "@/components/ui/switch";
import Link from "next/link"

interface UserMenuProps {
  user: SupabaseUser
  onLogout: () => void
}

export default function UserMenu({ 
  user, 
  onLogout, 
  onToggleSidebar, 
  sidebarEnabled
}: UserMenuProps & { 
  onToggleSidebar?: (enabled: boolean) => void, 
  sidebarEnabled?: boolean
}) {
  const [showProfile, setShowProfile] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateMessage, setUpdateMessage] = useState("")
  const router = useRouter()

  useEffect(() => {
    fetchProfile()
  }, [user.id])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error)
        return
      }

      if (data) {
        console.log("Perfil cargado:", data)
        setProfile(data)
      } else {
        // Crear perfil si no existe
        const newProfile = {
          id: user.id,
          email: user.email || "",
          full_name: user.user_metadata?.full_name || "",
        }

        const { data: createdProfile, error: createError } = await supabase
          .from("profiles")
          .insert([newProfile])
          .select()
          .single()

        if (!createError && createdProfile) {
          setProfile(createdProfile)
        }
      }
    } catch (error) {
      console.error("Error with profile:", error)
    }
  }

  const updateProfile = async () => {
    if (!profile) return

    setIsUpdating(true)
    setUpdateMessage("")

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          agency_name: profile.agency_name,
          phone: profile.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      setUpdateMessage("Perfil actualizado correctamente")
      setTimeout(() => setUpdateMessage(""), 3000)
    } catch (error: any) {
      setUpdateMessage("Error al actualizar el perfil")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onLogout()
  }

  const goToHistory = () => {
    if (typeof window !== 'undefined' && window.location.pathname === '/') {
      window.dispatchEvent(new CustomEvent('goToHistoryTab'));
    } else {
      router.push('/?tab=history');
    }
  };

  const goToCreateQuote = () => {
    if (typeof window !== 'undefined' && window.location.pathname === '/') {
      window.dispatchEvent(new CustomEvent('goToCreateQuoteTab'));
    } else {
      router.push('/');
    }
  };

  const goToTemplates = () => {
    if (typeof window !== 'undefined' && window.location.pathname === '/') {
      window.dispatchEvent(new CustomEvent('goToTemplatesTab'));
    } else {
      router.push('/?tab=templates');
    }
  };

  if (showProfile && profile) {
    return (
      <Card className="fixed top-4 right-4 w-96 z-50 shadow-lg max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Mi Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile.email} disabled className="bg-gray-50" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input
              id="fullName"
              value={profile.full_name || ""}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              placeholder="Tu nombre completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agencyName">Nombre de la agencia</Label>
            <Input
              id="agencyName"
              value={profile.agency_name || ""}
              onChange={(e) => setProfile({ ...profile, agency_name: e.target.value })}
              placeholder="Nombre de tu agencia de viajes"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              value={profile.phone || ""}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="Tu número de teléfono"
            />
          </div>

          <div className="text-xs text-gray-500">
            <p>Cuenta creada: {new Date(profile.created_at).toLocaleDateString()}</p>
          </div>

          {updateMessage && (
            <div
              className={`text-sm p-2 rounded ${
                updateMessage.includes("Error")
                  ? "bg-red-50 text-red-600 border border-red-200"
                  : "bg-green-50 text-green-600 border border-green-200"
              }`}
            >
              {updateMessage}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowProfile(false)} className="flex-1 px-3 py-1.5 text-sm font-medium border border-gray-200 bg-white/70 hover:bg-gray-50/80">
              Cerrar
            </Button>
            <Button size="sm" onClick={updateProfile} disabled={isUpdating} className="flex-1 px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-blue-400/70 to-blue-600/70 hover:from-blue-500/80 hover:to-blue-700/80">
              <Save className="h-3 w-3 mr-1" />
              {isUpdating ? "Guardando..." : "Guardar"}
            </Button>
          </div>

          <Button variant="destructive" size="sm" onClick={handleLogout} className="w-full px-3 py-1.5 text-sm font-medium bg-red-500/70 hover:bg-red-600/80">
            <LogOut className="h-3 w-3 mr-1" />
            Cerrar Sesión
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="bg-white shadow-md">
            <User className="h-4 w-4 mr-2" />
            {profile?.full_name || user.email?.split("@")[0] || "Usuario"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{profile?.full_name || "Usuario"}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
            {profile?.agency_name && <p className="text-xs text-blue-600">{profile.agency_name}</p>}
            <p className="text-xs text-gray-500">Rol: {profile?.role || 'user'}</p>
          </div>
          <DropdownMenuSeparator />
          {profile?.role === 'admin' && (
            <>
              <DropdownMenuItem onClick={() => router.push('/admin')}>
                <Shield className="h-4 w-4 mr-2" />
                Panel Admin
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={() => setShowProfile(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Editar Perfil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={goToCreateQuote}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Crear Cotización
          </DropdownMenuItem>
          <DropdownMenuItem onClick={goToHistory}>
            <ListChecks className="h-4 w-4 mr-2" />
            Mis Cotizaciones
          </DropdownMenuItem>
          <DropdownMenuItem onClick={goToTemplates}>
            <Layout className="h-4 w-4 mr-2" />
            Mis Templates
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* Sección de Configuraciones */}
          <div className="px-2 py-1.5">
            <p className="text-sm font-semibold text-gray-700 mb-2">Configuración</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Panel de asistencia</span>
              <Switch
                checked={sidebarEnabled}
                onCheckedChange={onToggleSidebar}
                size="sm"
                aria-label="Activar/desactivar sidebars"
              />
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600">
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
