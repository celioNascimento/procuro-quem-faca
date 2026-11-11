//hooks/admin/useAdminTitular.ts

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  atualizarPedidoTitular,
  listarPedidosTitular,
  type PedidoAdmin,
  type StatusPedido,
} from '@/lib/services/adminTitular.service'
import { gerarTokenReivindicacao } from '@/lib/services/ativacao.service'
import { montarMensagemAtivacao } from '@/lib/ativacao/mensagem'
import { buildLinkWhatsapp } from '@/lib/utils/whatsapp'
import { statusEstaAberto } from '@/lib/titular/prazo'

export type FiltroPedidos = 'abertas' | 'todas'

function mensagemDeErro(e: unknown): string {
  const codigo = e instanceof Error ? e.message : ''
  if (codigo === 'PERFIL_JA_TEM_CONTA') return 'Este perfil já tem conta: o titular exclui ou edita pela própria conta.'
  if (codigo === 'SEM_WHATSAPP') return 'O perfil não tem um WhatsApp válido.'
  if (codigo === 'SEM_PERMISSAO') return 'Sem permissão de administrador.'
  return 'Não foi possível concluir a ação. Tente novamente.'
}

export function useAdminTitular() {
  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtro, setFiltro] = useState<FiltroPedidos>('abertas')
  const [processandoId, setProcessandoId] = useState<string | null>(null)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    try {
      setPedidos(await listarPedidosTitular())
      setErro('')
    } catch (e) {
      console.error('[titular] erro ao carregar pedidos', e)
      setErro('Não foi possível carregar os pedidos.')
    } finally {
      setCarregando(false)
    }
  }, [])

  // Mesmo padrão da tela de ativação: a carga inicial sai do corpo do efeito
  useEffect(() => { queueMicrotask(carregar) }, [carregar])

  const lista = useMemo(
    () => (filtro === 'abertas' ? pedidos.filter(p => statusEstaAberto(p.status)) : pedidos),
    [pedidos, filtro],
  )

  const executar = useCallback(async (id: string, acao: () => Promise<void>) => {
    setProcessandoId(id)
    setErro('')
    try {
      await acao()
      await carregar()
    } catch (e) {
      console.error('[titular] erro na ação', e)
      setErro(mensagemDeErro(e))
    } finally {
      setProcessandoId(null)
    }
  }, [carregar])

  const marcarEmAnalise = useCallback(
    (id: string) => executar(id, () => atualizarPedidoTitular(id, { status: 'em_analise' })),
    [executar],
  )

  const concluir = useCallback(
    (id: string, status: Extract<StatusPedido, 'atendida' | 'negada'>, resposta: string) =>
      executar(id, () => atualizarPedidoTitular(id, { status, resposta: resposta.trim() || null })),
    [executar],
  )

  // Envia o link pessoal SEMPRE ao WhatsApp do perfil, nunca ao contato digitado no formulário:
  // quem recebe a mensagem naquele número é quem prova ser o titular.
  const enviarLinkAoWhatsappDoPerfil = useCallback(async (pedido: PedidoAdmin) => {
    const perfil = pedido.prestadores
    if (!perfil || !pedido.prestador_id) return
    setProcessandoId(pedido.id)
    setErro('')
    // Abre a aba antes do await para o navegador não bloquear o pop-up
    const aba = window.open('', '_blank')
    try {
      if (perfil.user_id) throw new Error('PERFIL_JA_TEM_CONTA')
      const token = await gerarTokenReivindicacao(pedido.prestador_id)
      const mensagem = montarMensagemAtivacao({
        tipo: 'resposta_pedido',
        nome: perfil.nome,
        slug: perfil.slug ?? String(pedido.prestador_id),
        token,
      })
      const link = buildLinkWhatsapp(perfil.whatsapp, mensagem)
      if (!link) throw new Error('SEM_WHATSAPP')
      if (aba) aba.location.href = link
      else window.location.assign(link)
      if (pedido.status === 'recebida') await atualizarPedidoTitular(pedido.id, { status: 'em_analise' })
      await carregar()
    } catch (e) {
      if (aba) aba.close()
      console.error('[titular] erro ao enviar o link', e)
      setErro(mensagemDeErro(e))
    } finally {
      setProcessandoId(null)
    }
  }, [carregar])

  return {
    lista, total: pedidos.length, carregando, filtro, setFiltro, processandoId, erro,
    marcarEmAnalise, concluir, enviarLinkAoWhatsappDoPerfil,
  }
}
