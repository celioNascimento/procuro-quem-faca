// lib/ativacao/lista.ts
//
// Apoio da lista da tela /admin/ativacao. A tabela `prestadores` tem perfis sem nome (cadastros
// iniciados e não concluídos), então nome e slug podem vir vazios: nada aqui pode assumir texto.

interface PerfilDaLista {
  nome?: string | null
  slug?: string | null
}

export const NOME_PADRAO = '(sem nome)'

export function nomeDoPerfil(perfil: PerfilDaLista): string {
  return perfil.nome?.trim() || NOME_PADRAO
}

// Busca por trecho do nome ou do slug, sem diferenciar maiúsculas de minúsculas
export function correspondeABusca(perfil: PerfilDaLista, busca: string): boolean {
  const termo = busca.trim().toLowerCase()
  if (!termo) return true
  return (
    (perfil.nome ?? '').toLowerCase().includes(termo) ||
    (perfil.slug ?? '').toLowerCase().includes(termo)
  )
}

// ─── Dados de ativação vindos da tabela própria (prestador_ativacao) ──────────────────────────
// A consulta traz o funil embutido: `prestador_ativacao(status, enviado_em, respondeu_em, obs)`.
// Aqui ele volta ao formato plano que as telas já usam. Perfil sem linha ainda não foi contatado.

export interface AtivacaoEmbutida {
  status: string
  enviado_em: string | null
  respondeu_em: string | null
  obs: string | null
}

type ComAtivacao = { prestador_ativacao?: AtivacaoEmbutida | AtivacaoEmbutida[] | null }

export type AtivacaoPlana = {
  ativacao_status: string
  ativacao_enviado_em: string | null
  ativacao_respondeu_em: string | null
  ativacao_obs: string | null
}

export function achatarAtivacao<T extends ComAtivacao>(linha: T): Omit<T, 'prestador_ativacao'> & AtivacaoPlana {
  const { prestador_ativacao: embutida, ...resto } = linha
  const ativacao = Array.isArray(embutida) ? embutida[0] : embutida
  return {
    ...resto,
    ativacao_status: ativacao?.status ?? 'nao_enviado',
    ativacao_enviado_em: ativacao?.enviado_em ?? null,
    ativacao_respondeu_em: ativacao?.respondeu_em ?? null,
    ativacao_obs: ativacao?.obs ?? null,
  }
}
