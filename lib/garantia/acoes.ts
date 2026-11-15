// lib/garantia/acoes.ts
//
// As ações do fluxo de garantia que mudam o banco. Cada uma vira UMA função do banco (RPC) que confere
// quem está chamando e se a mudança é permitida. Aqui ficam só a validação do corpo da requisição e o
// mapa ação → função/aviso; a rota (app/api/garantia/acao) e o service usam o mesmo contrato.

import type { EventoGarantia } from '@/lib/notificacoes/garantia'

export type AcaoGarantia =
  | 'abrir'
  | 'oferecer'
  | 'aceitar'
  | 'recusar'
  | 'responder'
  | 'confirmar'
  | 'reabrir'

export interface PedidoGarantia {
  acao: AcaoGarantia
  projetoId?: string
  avaliacaoId?: string
  casoId?: string
  texto?: string
  fotos?: string[]
  nota?: number
}

export interface ChamadaRpc {
  funcao: string
  args: Record<string, unknown>
  evento: EventoGarantia
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ehUuid = (v: unknown): v is string => typeof v === 'string' && UUID.test(v)
const ehTexto = (v: unknown): v is string => typeof v === 'string' && v.length <= 2000

/** Valida o corpo e devolve a chamada do banco, ou a mensagem do que está errado. */
export function montarChamada(corpo: unknown): { ok: true; chamada: ChamadaRpc } | { ok: false; erro: string } {
  if (typeof corpo !== 'object' || corpo === null) return { ok: false, erro: 'Pedido inválido.' }
  const p = corpo as PedidoGarantia
  const invalido = { ok: false as const, erro: 'Pedido inválido.' }

  switch (p.acao) {
    case 'abrir':
      if (!ehUuid(p.projetoId) || !ehTexto(p.texto)) return invalido
      return { ok: true, chamada: { funcao: 'garantia_abrir_caso', args: { p_projeto_id: p.projetoId, p_descricao: p.texto }, evento: 'aberto' } }
    case 'oferecer':
      if (!ehUuid(p.avaliacaoId) || !ehTexto(p.texto)) return invalido
      return { ok: true, chamada: { funcao: 'garantia_oferecer_reparo', args: { p_avaliacao_id: p.avaliacaoId, p_descricao: p.texto }, evento: 'oferta' } }
    case 'aceitar':
      if (!ehUuid(p.casoId)) return invalido
      return { ok: true, chamada: { funcao: 'garantia_aceitar_oferta', args: { p_caso_id: p.casoId }, evento: 'aceita' } }
    case 'recusar':
      if (!ehUuid(p.casoId)) return invalido
      return { ok: true, chamada: { funcao: 'garantia_recusar_oferta', args: { p_caso_id: p.casoId }, evento: 'recusada' } }
    case 'responder':
      if (!ehUuid(p.casoId) || !ehTexto(p.texto)) return invalido
      return { ok: true, chamada: { funcao: 'garantia_responder', args: { p_caso_id: p.casoId, p_resposta: p.texto }, evento: 'respondido' } }
    case 'confirmar': {
      const fotos = p.fotos ?? []
      if (!ehUuid(p.casoId) || !ehTexto(p.texto ?? '')) return invalido
      if (!Array.isArray(fotos) || fotos.length > 20 || fotos.some((f) => typeof f !== 'string' || f.length > 500)) return invalido
      if (p.nota !== undefined && (!Number.isInteger(p.nota) || p.nota < 1 || p.nota > 5)) return invalido
      return {
        ok: true,
        chamada: {
          funcao: 'garantia_confirmar_resolucao',
          args: { p_caso_id: p.casoId, p_descricao: p.texto ?? '', p_fotos: fotos, p_nova_nota: p.nota ?? null },
          evento: 'resolvido',
        },
      }
    }
    case 'reabrir':
      if (!ehUuid(p.casoId)) return invalido
      return { ok: true, chamada: { funcao: 'garantia_reabrir', args: { p_caso_id: p.casoId }, evento: 'reaberto' } }
    default:
      return invalido
  }
}
