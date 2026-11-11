//lib/services/titular.service.ts
//
// Envia o pedido do titular para a rota do servidor (que registra e avisa o administrador).

import type { TipoPedido } from '@/lib/titular/pedido'

export interface EntradaPedidoTitular {
  tipo: TipoPedido
  nome: string
  contato: string
  descricao: string
  prestadorId: number | null
  website: string
}

export interface ConfirmacaoPedido {
  protocolo: string
  prazoDias: number
}

export class ErroPedidoTitular extends Error {
  constructor(
    public status: number,
    public erros?: Record<string, string>,
  ) {
    super(`PEDIDO_TITULAR_${status}`)
  }
}

export async function enviarPedidoTitular(entrada: EntradaPedidoTitular): Promise<ConfirmacaoPedido> {
  const resposta = await fetch('/api/titular', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entrada),
  })

  const corpo = await resposta.json().catch(() => ({}))
  if (!resposta.ok) throw new ErroPedidoTitular(resposta.status, corpo?.erros)

  return { protocolo: String(corpo.protocolo), prazoDias: Number(corpo.prazoDias) }
}
