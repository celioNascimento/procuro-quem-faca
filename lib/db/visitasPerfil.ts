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
 *
 * A GRAVAÇÃO é feita pelo servidor (POST /api/prestadores/visita-perfil), que
 * decide o que conta: ignora robôs e o dono do perfil, aplica o dedupe de 24h
 * por sessão, respeita o modo do rastreio e grava origem e campanha. O
 * navegador não insere mais direto no banco. A LEITURA abaixo continua pelo
 * cliente do navegador, protegida pelo RLS.
 */

const DEDUPE_DIAS = 1
const ROTA_VISITA = '/api/prestadores/visita-perfil'

// Prestadores com pedido em andamento nesta aba. Evita duas chamadas quase
// simultâneas (ex.: o hook do perfil carregando duas vezes seguidas) antes de
// o cookie de dedupe existir.
const emVoo = new Set<string>()

function cookieKeyVisita(prestadorId: number | string): string {
  return `pqf_visita_perfil_${prestadorId}`
}

/**
 * Pede ao servidor para registrar 1 visita ao perfil. O cookie de 24h por
 * prestador só evita chamadas repetidas do mesmo navegador (um F5 não precisa
 * nem ir ao servidor); a regra que vale é a do servidor. Cookie (não
 * sessionStorage) porque sessionStorage zera a cada nova aba, e abrir o link
 * do WhatsApp em nova aba não deveria contar como novo acesso.
 *
 * O cookie é gravado quando o servidor responde ok, mesmo que ele tenha
 * ignorado a visita (robô, dono do perfil, repetida): repetir o pedido não
 * mudaria o resultado.
 *
 * Silencioso em caso de erro — nunca deve quebrar o carregamento da página
 * de perfil por causa de uma falha no registro de métrica.
 */
export async function registrarVisitaPerfil(prestadorId: number | string): Promise<void> {
  if (typeof window === 'undefined') return

  const id = Number(prestadorId)
  if (!Number.isInteger(id) || id <= 0) return

  const cookieKey = cookieKeyVisita(id)
  if (getCookie(cookieKey) || emVoo.has(cookieKey)) return

  emVoo.add(cookieKey)
  try {
    // keepalive: o pedido termina mesmo que a pessoa saia da página logo em seguida.
    const resposta = await fetch(ROTA_VISITA, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prestadorId: id }),
      keepalive: true,
    })
    if (!resposta.ok) throw new Error(`status ${resposta.status}`)
    setCookie(cookieKey, '1', DEDUPE_DIAS)
  } catch (err) {
    console.error('[registrarVisitaPerfil] falha ao registrar visita:', err)
  } finally {
    emVoo.delete(cookieKey)
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