// lib/titular/prazo.ts

export type SituacaoPrazo =
  | { tipo: 'encerrada' }
  | { tipo: 'atrasada'; dias: number }
  | { tipo: 'hoje' }
  | { tipo: 'no_prazo'; dias: number }

const STATUS_ABERTOS = ['recebida', 'em_analise']

export function statusEstaAberto(status: string): boolean {
  return STATUS_ABERTOS.includes(status)
}

const MS_DIA = 24 * 60 * 60 * 1000

// `prazo` vem do banco como data (YYYY-MM-DD). Compara por dia, sem horário.
export function situacaoPrazo(prazo: string, status: string, hoje: Date = new Date()): SituacaoPrazo {
  if (!statusEstaAberto(status)) return { tipo: 'encerrada' }
  const [ano, mes, dia] = prazo.split('-').map(Number)
  const dataPrazo = Date.UTC(ano, mes - 1, dia)
  const dataHoje = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  const diferenca = Math.round((dataPrazo - dataHoje) / MS_DIA)
  if (diferenca < 0) return { tipo: 'atrasada', dias: Math.abs(diferenca) }
  if (diferenca === 0) return { tipo: 'hoje' }
  return { tipo: 'no_prazo', dias: diferenca }
}

export function formatarDataPrazo(prazo: string): string {
  const [ano, mes, dia] = prazo.split('-')
  return `${dia}/${mes}/${ano}`
}
