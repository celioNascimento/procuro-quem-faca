// lib/garantia/avisos.ts
//
// Regras dos AVISOS DENTRO DO APP sobre casos de garantia/reclamação (não há e-mail ao cliente nem
// ao prestador — decisão de 15/11/2026). Funções puras: quem desenha a tela só chama estas.
//
// Quem precisa agir em cada estado:
//   aberta                     -> o PRESTADOR (responder dentro do prazo)
//   respondida                 -> o CLIENTE   (confirmar que resolveu ou reabrir)
//   aguardando_aceite_cliente  -> o CLIENTE   (aceitar ou recusar a oferta de reparo)

export interface CasoResumo {
  status: string
  prazo_resposta?: string | null
}

/** O prestador precisa responder este caso. */
export function pedeRespostaDoPrestador(caso: Pick<CasoResumo, 'status'>): boolean {
  return caso.status === 'aberta'
}

/** O cliente precisa decidir algo neste caso. */
export function pedeRetornoDoCliente(caso: Pick<CasoResumo, 'status'>): boolean {
  return caso.status === 'respondida' || caso.status === 'aguardando_aceite_cliente'
}

/** Data de hoje (YYYY-MM-DD) no horário de São Paulo — o mesmo relógio que o banco usa nos prazos. */
export function hojeEmSaoPaulo(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(agora)
}

/** "2026-11-18" -> "18/11". Texto inesperado volta como veio (nunca quebra a tela). */
export function dataCurta(iso: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '')
  return m ? `${m[3]}/${m[2]}` : ''
}

/** Frase curta sobre o prazo de resposta do prestador. */
export function fraseDoPrazo(prazo: string | null | undefined, hoje: string = hojeEmSaoPaulo()): string {
  const data = dataCurta(prazo)
  if (!data || !prazo) return ''
  const dia = prazo.slice(0, 10)
  if (dia < hoje) return `o prazo terminou em ${data}`
  if (dia === hoje) return 'o prazo termina hoje'
  return `prazo até ${data}`
}

/** Entre vários casos esperando resposta, o prazo que vence primeiro (ou null se nenhum tem prazo). */
export function prazoMaisProximo(casos: CasoResumo[]): string | null {
  const prazos = casos
    .filter(pedeRespostaDoPrestador)
    .map((c) => c.prazo_resposta?.slice(0, 10))
    .filter((p): p is string => !!p)
    .sort()
  return prazos[0] ?? null
}
