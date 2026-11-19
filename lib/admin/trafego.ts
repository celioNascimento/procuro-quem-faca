// lib/admin/trafego.ts
// Lê o resumo de tráfego do banco (admin_trafego_resumo) e diz, em português simples, o que é gente de verdade
// e o que merece desconfiança. Função pura: não acessa banco.

export interface ResumoTrafego {
  dias: number
  buscas: { total: number; equipe: number; logados: number; anonimas: number }
  visitas_via_busca: { total: number; equipe: number; anonimas: number; perfis_distintos_anonimos: number }
  dias_suspeitos: number
  visitas_perfil: { total: number; com_sessao: number; sem_sessao: number }
}

export interface LeituraTrafego {
  /** Buscas que não são da equipe (logados + anônimas). Ainda inclui teste de amigos e você em aba anônima. */
  buscasDeFora: number
  /** Visitas via busca que não são da equipe. */
  visitasDeFora: number
  /** Visitas gravadas pelo servidor com filtro de robô: o número mais confiável. */
  visitasConfiaveis: number
  /** Parte das visitas gravada pelo método antigo, sem filtro de robô. */
  visitasSemFiltro: number
  /** Percentual (0-100) das buscas que vieram da equipe. */
  pctEquipeNasBuscas: number
  alertas: string[]
}

export const RESUMO_VAZIO: ResumoTrafego = {
  dias: 30,
  buscas: { total: 0, equipe: 0, logados: 0, anonimas: 0 },
  visitas_via_busca: { total: 0, equipe: 0, anonimas: 0, perfis_distintos_anonimos: 0 },
  dias_suspeitos: 0,
  visitas_perfil: { total: 0, com_sessao: 0, sem_sessao: 0 },
}

/** Garante números, mesmo se o banco devolver algo incompleto. */
export function normalizarResumo(bruto: unknown): ResumoTrafego {
  const b = (bruto ?? {}) as Record<string, Record<string, unknown> | number | undefined>
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v) || 0)
  const obj = (k: string) => (typeof b[k] === 'object' && b[k] !== null ? (b[k] as Record<string, unknown>) : {})
  return {
    dias: n(b.dias) || RESUMO_VAZIO.dias,
    buscas: { total: n(obj('buscas').total), equipe: n(obj('buscas').equipe), logados: n(obj('buscas').logados), anonimas: n(obj('buscas').anonimas) },
    visitas_via_busca: {
      total: n(obj('visitas_via_busca').total), equipe: n(obj('visitas_via_busca').equipe),
      anonimas: n(obj('visitas_via_busca').anonimas), perfis_distintos_anonimos: n(obj('visitas_via_busca').perfis_distintos_anonimos),
    },
    dias_suspeitos: n(b.dias_suspeitos),
    visitas_perfil: { total: n(obj('visitas_perfil').total), com_sessao: n(obj('visitas_perfil').com_sessao), sem_sessao: n(obj('visitas_perfil').sem_sessao) },
  }
}

export function lerTrafego(r: ResumoTrafego): LeituraTrafego {
  const buscasDeFora = r.buscas.logados + r.buscas.anonimas
  const visitasDeFora = Math.max(0, r.visitas_via_busca.total - r.visitas_via_busca.equipe)
  const pctEquipeNasBuscas = r.buscas.total === 0 ? 0 : Math.round((r.buscas.equipe / r.buscas.total) * 100)
  const alertas: string[] = []

  if (r.dias_suspeitos > 0) {
    alertas.push(
      `${r.dias_suspeitos} ${r.dias_suspeitos === 1 ? 'dia teve' : 'dias tiveram'} muitas visitas anônimas em que quase cada uma foi a um perfil diferente. Isso parece um robô percorrendo a lista, não clientes procurando um serviço.`,
    )
  }
  if (r.buscas.total >= 10 && pctEquipeNasBuscas >= 30) {
    alertas.push(`${pctEquipeNasBuscas}% das buscas do período vieram da equipe. Não use esse número como demanda de clientes.`)
  }
  if (r.visitas_perfil.sem_sessao > 0) {
    alertas.push(`${r.visitas_perfil.sem_sessao} visitas do período foram gravadas pelo método antigo, sem filtro de robô.`)
  }

  return {
    buscasDeFora,
    visitasDeFora,
    visitasConfiaveis: r.visitas_perfil.com_sessao,
    visitasSemFiltro: r.visitas_perfil.sem_sessao,
    pctEquipeNasBuscas,
    alertas,
  }
}
