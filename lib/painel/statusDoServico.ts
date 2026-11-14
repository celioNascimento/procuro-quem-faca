// lib/painel/statusDoServico.ts
//
// Um só lugar para o nome e a cor do status de um trabalho na área do cliente. Antes havia duas cópias
// (hooks/useServicosCliente e components/meus-servicos/PainelDoCliente) e o mesmo trabalho aparecia como
// "Aguardando aceite" numa tela e "Aguardando" na outra, "Finalizado" numa e "Concluído" na outra.

export type StatusVisual = {
  label: string
  dot: string
  badge: string
  urgente: boolean
}

type FotoOrdem = { ordem: number }

/**
 * "Pronto para avaliar": o prestador já fez o último passo.
 * Fluxo com fotos: existe a foto final (ordem 3). Fluxo sem fotos: o prestador marcou como concluído.
 */
export function estaProntoParaAvaliar(s: {
  sem_fotos?: boolean | null
  marcado_concluido_at?: string | null
  portfolio_fotos?: FotoOrdem[] | null
}): boolean {
  if (s.sem_fotos) return !!s.marcado_concluido_at
  return s.portfolio_fotos?.some(f => f.ordem === 3) ?? false
}

const LARANJA = 'bg-orange-50 text-orange-800 border-orange-200'

export function statusVisualDoServico(args: {
  status?: string | null
  pronto?: boolean
  jaAvaliado?: boolean
  caso?: 'garantia' | 'reclamacao' | null
}): StatusVisual {
  const { pronto = false, caso = null } = args
  const s = args.status?.toLowerCase()

  if (caso === 'garantia')   return { label: 'Garantia',   dot: 'bg-orange-400', badge: LARANJA, urgente: true }
  if (caso === 'reclamacao') return { label: 'Reclamação', dot: 'bg-orange-400', badge: LARANJA, urgente: true }

  if (s === 'em_registro')
    return { label: 'Em preparo', dot: 'bg-slate-300', badge: 'bg-slate-50 text-slate-600 border-slate-200', urgente: false }
  if (s === 'pendente' || s === 'aguardando_aceite')
    return { label: 'Aguardando aceite', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-800 border-amber-200', urgente: false }
  if (s === 'em_execucao' && pronto)
    return { label: 'Avaliar agora', dot: 'bg-blue-500', badge: 'bg-blue-600 text-white border-blue-600', urgente: true }
  if (s === 'em_execucao')
    return { label: 'Em andamento', dot: 'bg-blue-400', badge: 'bg-blue-50 text-blue-800 border-blue-200', urgente: false }
  if (s === 'finalizado')
    return { label: 'Concluído', dot: 'bg-green-400', badge: 'bg-green-50 text-green-800 border-green-200', urgente: false }
  if (s === 'em_disputa')
    return { label: 'Em análise', dot: 'bg-orange-400', badge: LARANJA, urgente: true }

  return { label: 'Status indisponível', dot: 'bg-slate-300', badge: 'bg-slate-50 text-slate-600 border-slate-200', urgente: false }
}
