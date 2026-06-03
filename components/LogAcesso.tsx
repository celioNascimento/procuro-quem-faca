'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { insertAcesso } from '@/lib/db/acessos'

export default function LogAcesso() {
  useEffect(() => {
    const registrarAcesso = async () => {
      if (sessionStorage.getItem('sessao_registrada')) return

      try {
        const { data: { session } } = await supabase.auth.getSession()

        await insertAcesso({
          userId: session?.user?.id ?? null,
          userEmail: session?.user?.email ?? null,
        })

        sessionStorage.setItem('sessao_registrada', 'true')
      } catch (err) {
        console.error('Erro log acesso:', err)
      }
    }

    registrarAcesso()
  }, [])

  return null
}