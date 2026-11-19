// lib/feed/perfilSocial.ts
// Regras puras de curtir e seguir no perfil público. Sem acesso a banco.

export interface CurtidaDoTrabalho { total: number; curtidoPorMim: boolean; salvoPorMim: boolean }

export interface PerfilSocial {
  totalSeguidores: number
  seguindo: boolean
  /** O perfil é de quem está olhando: não mostra Seguir nem Curtir. */
  meuPerfil: boolean
  /** Por id do trabalho. */
  curtidas: Record<string, CurtidaDoTrabalho>
}

/** Transforma a resposta do banco (perfil_social). null = perfil sem curtir/seguir (inativo, bloqueado, exemplo). */
export function normalizarPerfilSocial(bruto: unknown): PerfilSocial | null {
  if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) return null
  const b = bruto as Record<string, unknown>
  const curtidas: Record<string, CurtidaDoTrabalho> = {}
  const c = b.curtidas
  if (c && typeof c === 'object' && !Array.isArray(c)) {
    for (const [id, v] of Object.entries(c as Record<string, unknown>)) {
      const x = (v ?? {}) as Record<string, unknown>
      curtidas[id] = { total: Math.max(0, Number(x.total) || 0), curtidoPorMim: x.curtido_por_mim === true, salvoPorMim: x.salvo_por_mim === true }
    }
  }
  return {
    totalSeguidores: Math.max(0, Number(b.total_seguidores) || 0),
    seguindo: b.seguindo === true,
    meuPerfil: b.meu_perfil === true,
    curtidas,
  }
}

/** "12 seguidores", "1 seguidor"; sem seguidores, nada (o botão Seguir já basta). */
export function textoSeguidores(total: number): string {
  if (total <= 0) return ''
  return total === 1 ? '1 seguidor' : `${total} seguidores`
}

export function aplicarSeguirNoPerfil(s: PerfilSocial, seguindo: boolean): PerfilSocial {
  if (s.seguindo === seguindo) return s
  return { ...s, seguindo, totalSeguidores: Math.max(0, s.totalSeguidores + (seguindo ? 1 : -1)) }
}

export function aplicarCurtidaNoPerfil(s: PerfilSocial, projetoId: string, curtido: boolean, total: number): PerfilSocial {
  const atual = s.curtidas[projetoId]
  return { ...s, curtidas: { ...s.curtidas, [projetoId]: { total: Math.max(0, total), curtidoPorMim: curtido, salvoPorMim: atual?.salvoPorMim ?? false } } }
}

export function aplicarSalvoNoPerfil(s: PerfilSocial, projetoId: string, salvo: boolean): PerfilSocial {
  const atual = s.curtidas[projetoId] ?? { total: 0, curtidoPorMim: false, salvoPorMim: false }
  return { ...s, curtidas: { ...s.curtidas, [projetoId]: { ...atual, salvoPorMim: salvo } } }
}
