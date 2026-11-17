// app/api/cron/cnpj-reverificacao/route.ts
//
// Mantém o selo de CNPJ em dia, uma vez por dia (cron da Vercel — vercel.json). A Vercel envia
// "Authorization: Bearer <CRON_SECRET>". Sem CRON_SECRET configurado, a rota recusa tudo.
//
// O que a rotina faz:
//  1) reconsulta na Receita os selos que vencem em até 5 dias (até 20 por execução) e renova ou derruba;
//  2) marca como 'expirada' o selo cuja validade passou sem renovar;
//  3) apaga do cache de consultas o que já venceu.
// Rodar mais de uma vez no mesmo dia é seguro: quem já foi renovado deixa de aparecer na lista.

import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { consultarCnpj, type CacheConsulta, type DadosCnpj } from '@/lib/cnpj/consulta'
import { reverificarCnpjs, type RepositorioReverificacao, type ResultadoRegistro } from '@/lib/cnpj/reverificar'

export const maxDuration = 60

export async function GET(request: Request) {
  const segredo = process.env.CRON_SECRET
  if (!segredo) return NextResponse.json({ error: 'Rota não configurada.' }, { status: 500 })
  if (request.headers.get('authorization') !== `Bearer ${segredo}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const admin = getAdminClient()

    const repositorio: RepositorioReverificacao = {
      async listarPendentes(limite) {
        const { data, error } = await admin.rpc('cnpj_reverificacao_pendentes', { p_limite: limite })
        if (error) throw error
        return ((data ?? []) as { prestador_id: number; cnpj: string }[]).map((l) => ({
          prestadorId: l.prestador_id,
          cnpj: l.cnpj,
        }))
      },
      async registrar(prestadorId, situacao, fonte) {
        const { data, error } = await admin.rpc('cnpj_registrar_reverificacao', {
          p_prestador_id: prestadorId,
          p_situacao: situacao,
          p_fonte: fonte,
        })
        if (error) throw error
        return data as ResultadoRegistro
      },
    }

    // Mesmo cache compartilhado (24h) da rota /api/cnpj.
    const cache: CacheConsulta = {
      async get(cnpj) {
        const { data, error } = await admin
          .from('cnpj_consultas_cache')
          .select('dados, expira_em')
          .eq('cnpj', cnpj)
          .maybeSingle()
        if (error) throw error
        if (!data) return undefined
        return { dados: data.dados as DadosCnpj, expiraEm: new Date(data.expira_em).getTime() }
      },
      async set(cnpj, { dados, expiraEm }) {
        const { error } = await admin.from('cnpj_consultas_cache').upsert(
          { cnpj, dados, consultado_em: new Date().toISOString(), expira_em: new Date(expiraEm).toISOString() },
          { onConflict: 'cnpj' },
        )
        if (error) throw error
      },
    }

    const resumo = await reverificarCnpjs({ repositorio, consultar: (cnpj) => consultarCnpj(cnpj, { cache }) })

    const { data: expirados, error: erroExpirar } = await admin.rpc('cnpj_expirar_vencidos')
    if (erroExpirar) throw erroExpirar
    const { data: cacheLimpo, error: erroCache } = await admin.rpc('cnpj_limpar_cache')
    if (erroCache) throw erroCache

    return NextResponse.json({ ok: true, ...resumo, expirados: expirados ?? 0, cacheLimpo: cacheLimpo ?? 0 })
  } catch (e) {
    console.error('[cron] reverificação de CNPJ falhou', e instanceof Error ? e.message : 'erro')
    return NextResponse.json({ error: 'Falha ao reverificar os CNPJs.' }, { status: 500 })
  }
}
