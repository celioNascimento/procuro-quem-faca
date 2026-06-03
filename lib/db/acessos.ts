import { supabase } from '@/lib/supabase'

type DadosAcesso = {
  userId: string | null
  userEmail: string | null
}

export async function insertAcesso({ userId, userEmail }: DadosAcesso) {
  return supabase.from('logs_atividades').insert({
    acao: 'ACESSO_SITE',
    entidade_tipo: 'visita',
    usuario_id: userId,
    usuario_email: userEmail,
    detalhes: {
      url_entrada: window.location.pathname,
      referrer: document.referrer || 'direto',
      resolucao: `${window.screen.width}x${window.screen.height}`,
      navegador: window.navigator.userAgent,
      data_acesso: new Date().toISOString(),
    },
  })
}