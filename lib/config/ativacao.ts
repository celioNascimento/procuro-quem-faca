// lib/config/ativacao.ts
//
// Configuração estática da campanha de ativação de prestadores: rótulos/cores
// de cada status, para qual status cada um avança, a ordem dos filtros e o
// template da mensagem de WhatsApp. Tudo aqui é puro (sem acesso a banco/rede)
// e é usado tanto pela página quanto pelo card de prestador.

export interface StatusAtivacao {
  label: string
  dot: string
  badge: string
  ordem: number
}

export const STATUS: Record<string, StatusAtivacao> = {
  nao_enviado: { label: 'Não enviado', dot: '#94a3b8', badge: 'bg-slate-100 text-slate-500', ordem: 0 },
  enviado: { label: 'Enviado', dot: '#3b82f6', badge: 'bg-blue-50 text-blue-600', ordem: 1 },
  respondeu_positivo: { label: 'Respondeu', dot: '#10b981', badge: 'bg-emerald-50 text-emerald-700', ordem: 2 },
  respondeu_negativo: { label: 'Recusou', dot: '#ef4444', badge: 'bg-red-50 text-red-500', ordem: 3 },
  sem_whatsapp: { label: 'Sem WhatsApp', dot: '#f97316', badge: 'bg-orange-50 text-orange-600', ordem: 4 },
  perfil_completo: { label: 'Perfil completo', dot: '#f59e0b', badge: 'bg-amber-50 text-amber-700', ordem: 5 },
  avaliacao_recebida: { label: 'Avaliado', dot: '#8b5cf6', badge: 'bg-violet-50 text-violet-700', ordem: 6 },
}

export const PROXIMOS: Record<string, string> = {
  nao_enviado: 'enviado',
  enviado: 'respondeu_positivo',
  respondeu_positivo: 'perfil_completo',
  perfil_completo: 'avaliacao_recebida',
}

export const FILTROS = [
  'todos',
  'nao_enviado',
  'enviado',
  'respondeu_positivo',
  'respondeu_negativo',
  'sem_whatsapp',
  'perfil_completo',
  'avaliacao_recebida',
] as const

export function montarMsgAtivacao(p: { nome: string; slug: string }): string {
  return (
    `Oi ${p.nome}, tudo bem? 👋\n\n` +
    `Sou o Célio, criador do *Procuro Quem Faça* — uma plataforma aqui de Londrina onde moradores buscam profissionais para serviços.\n\n` +
    `Montei um perfil pra vocês lá. Aqui está:\n` +
    `👉 procuroquemfaca.com.br/${p.slug}?src=ativacao\n\n` +
    `Quer ver como fica quando está completo, com fotos dos serviços?\n` +
    `👉 procuroquemfaca.com.br/carlos-mendes-pedreiro\n\n` +
    `A diferença tá nas fotos — antes, durante e depois de cada serviço. É como uma indicação permanente: o cliente vê o trabalho, já chega sabendo o que esperar.\n\n` +
    `É gratuito. Posso ajudar a completar se quiser. 🙂`
  )
}
