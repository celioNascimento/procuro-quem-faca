//lib/db/visitasPerfil.ts

import { supabase } from '@/lib/supabase'
import { setCookie, getCookie } from '@/lib/cookies'

/**
 * Registro de acesso a perfil público de prestador — tabela própria
 * (visitas_perfil), separada de logs_atividades de propósito: alto volume,
 * sem necessidade de campos de auditoria (ip_address, usuario_email).
 *
 * VISITA_PERFIL_VIA_BUSCA (logs_atividades, em usePerfilPrestador.ts)
 * continua existindo em paralelo — aquele é sobre origem/auditoria (só
 * dispara quando a visita veio da busca via ?from=), este é sobre contagem
 * geral de acesso (dispara sempre, independente de origem), usado para
 * exibir "você teve X acessos este mês" ao prestador.
 */

const DEDUPE_DIAS = 1

function cookieKeyVisita(prestadorId: number | string): string {
  return `pqf_visita_perfil_${prestadorId}`
}

/**
 * Registra 1 visita ao perfil, com dedupe de 24h por prestador via cookie —
 * evita que um F5 do próprio prestador olhando o próprio perfil, ou reload
 * do visitante, infle a contagem. Cookie (não sessionStorage) porque
 * sessionStorage zera a cada nova aba, e abrir o link do WhatsApp em nova
 * aba não deveria contar como novo acesso.
 *
 * Silencioso em caso de erro — nunca deve quebrar o carregamento da página
 * de perfil por causa de uma falha no registro de métrica.
 */
export async function registrarVisitaPerfil(prestadorId: number | string): Promise<void> {
  if (typeof window === 'undefined') return

  const cookieKey = cookieKeyVisita(prestadorId)
  if (getCookie(cookieKey)) return

  try {
    const { error } = await supabase.from('visitas_perfil').insert({
      prestador_id: prestadorId,
    })
    if (error) throw error
    setCookie(cookieKey, '1', DEDUPE_DIAS)
  } catch (err) {
    console.error('[registrarVisitaPerfil] falha ao registrar visita:', err)
  }
}

/**
 * Contagem de visitas do prestador no mês corrente — usado para exibir
 * "você teve X acessos este mês" no dashboard do prestador.
 */
export async function getVisitasDoMesAtual(prestadorId: number | string): Promise<number> {
  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from('visitas_perfil')
    .select('*', { count: 'exact', head: true })
    .eq('prestador_id', prestadorId)
    .gte('criado_em', inicioMes.toISOString())

  if (error) {
    console.error('[getVisitasDoMesAtual] erro ao contar visitas:', error)
    return 0
  }

  return count || 0
}

/**
 * Contagem total de visitas do prestador (histórico completo) — útil para
 * exibir um número acumulado além do recorte mensal, se necessário.
 */
export async function getVisitasTotais(prestadorId: number | string): Promise<number> {
  const { count, error } = await supabase
    .from('visitas_perfil')
    .select('*', { count: 'exact', head: true })
    .eq('prestador_id', prestadorId)

  if (error) {
    console.error('[getVisitasTotais] erro ao contar visitas:', error)
    return 0
  }

  return count || 0
}
