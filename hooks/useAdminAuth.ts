//hooks/useAdminAuth.ts

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

/**
 * Só lê dados do usuário logado para exibição (nome/email no header) e
 * expõe logout. NÃO decide acesso — isso já é responsabilidade do
 * middleware (ver middleware.ts, Regra C), que garante que só chega até
 * aqui quem já está validado como admin (exceto a própria /admin/login).
 */
export function useAdminAuth() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState('Administrador')
  const router = useRouter()

  useEffect(() => {
    const carregarDadosUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || '')
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin')
      }
    }

    carregarDadosUsuario()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email || '')
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Admin')
      } else {
        setUserEmail(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return { userEmail, userName, handleLogout }
}