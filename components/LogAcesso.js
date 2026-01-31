'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function LogAcesso() {
  useEffect(() => {
    const registrarAcesso = async () => {
      // 1. Verifica se já registramos essa sessão (aba do navegador aberta)
      // Se já registrou nesta aba, não faz nada para economizar banco.
      if (sessionStorage.getItem('sessao_registrada')) return

      try {
        // 2. Tenta pegar dados do usuário (se estiver logado)
        const { data: { session } } = await supabase.auth.getSession()
        const userId = session?.user?.id || null
        const userEmail = session?.user?.email || null

        // 3. Registra a visita
        await supabase.from('logs_atividades').insert({
          acao: 'ACESSO_SITE', // Ação específica de tráfego
          entidade_tipo: 'visita',
          usuario_id: userId, // Vincula se estiver logado
          usuario_email: userEmail,
          detalhes: {
            url_entrada: window.location.pathname,
            referrer: document.referrer || 'direto', // De onde ele veio (Google, Link, etc)
            resolucao: `${window.screen.width}x${window.screen.height}`,
            navegador: window.navigator.userAgent,
            data_acesso: new Date().toISOString()
          }
        })

        // 4. Marca a sessão como registrada para não duplicar no F5
        sessionStorage.setItem('sessao_registrada', 'true')

      } catch (err) {
        // Falha silenciosa para não travar o app do usuário
        console.error('Erro log acesso:', err)
      }
    }

    registrarAcesso()
  }, [])

  // Este componente não renderiza nada visualmente
  return null
}