'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from "next/link";

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData.session
      if (!session) {
        router.push('/')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      console.log('PERFIL:', profile)
      if (!profile || profile.role !== 'admin') {
        router.push('/')
        return
      }

      setIsAuthorized(true)
      await refreshUsers()
      setLoading(false)
    }

    fetchData()
  }, [router])

  const refreshUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, is_approved, is_rejected, role')
      .order('email', { ascending: true })

    if (data) setUsers(data)
  }

  const handleApprove = async (id: string) => {
    await supabase
      .from('profiles')
      .update({ is_approved: true, is_rejected: false })
      .eq('id', id)
    await refreshUsers()
  }

  const handleReject = async (id: string) => {
    await supabase
      .from('profiles')
      .update({ is_rejected: true, is_approved: false })
      .eq('id', id)
    await refreshUsers()
  }

  if (!isAuthorized) return null
  if (loading) return <p className="p-8 text-center">Cargando usuarios...</p>

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-300 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-3xl w-full flex flex-col items-center">
        <h1 className="text-4xl font-bold text-slate-800 mb-4">Panel de Administración</h1>
        <p className="text-lg text-slate-600 mb-8 text-center">
          Aquí podrás aprobar o rechazar usuarios, gestionar cuentas y ver el estado de la plataforma.
        </p>
        <div className="overflow-x-auto w-full mb-6">
          <table className="w-full border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="p-3 text-left font-semibold">Correo</th>
                <th className="p-3 text-center font-semibold">Rol</th>
                <th className="p-3 text-center font-semibold">Aprobado</th>
                <th className="p-3 text-center font-semibold">Rechazado</th>
                <th className="p-3 text-center font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t hover:bg-slate-50 transition-colors">
                  <td className="p-3 text-slate-800">{u.email}</td>
                  <td className="p-3 text-center capitalize">{u.role}</td>
                  <td className="p-3 text-center">{u.is_approved ? '✅' : '—'}</td>
                  <td className="p-3 text-center">{u.is_rejected ? '🚫' : '—'}</td>
                  <td className="p-3 text-center space-x-2">
                    {!u.is_approved && !u.is_rejected && (
                      <>
                        <button
                          onClick={() => handleApprove(u.id)}
                          className="text-white bg-green-600 px-3 py-1 rounded hover:bg-green-700 text-sm shadow"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleReject(u.id)}
                          className="text-white bg-red-600 px-3 py-1 rounded hover:bg-red-700 text-sm shadow"
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link href="/">
          <button className="mt-4 px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-xl shadow hover:from-slate-800 hover:to-slate-950 font-semibold text-lg transition-all">
            Volver al Home
          </button>
        </Link>
      </div>
    </div>
  )
}
