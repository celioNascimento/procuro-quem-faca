//hooks/useFormularioTitular.ts

'use client'

import { useState, useCallback } from 'react'
import { validarPedidoTitular, type TipoPedido } from '@/lib/titular/pedido'
import {
  enviarPedidoTitular,
  ErroPedidoTitular,
  type ConfirmacaoPedido,
} from '@/lib/services/titular.service'

interface Opcoes {
  prestadorId?: number | null
  tipoInicial?: TipoPedido
}

export function useFormularioTitular({ prestadorId = null, tipoInicial = 'exclusao' }: Opcoes = {}) {
  const [tipo, setTipo] = useState<TipoPedido>(tipoInicial)
  const [nome, setNome] = useState('')
  const [contato, setContato] = useState('')
  const [descricao, setDescricao] = useState('')
  const [website, setWebsite] = useState('') // campo escondido, só robôs preenchem
  const [enviando, setEnviando] = useState(false)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [erroGeral, setErroGeral] = useState('')
  const [confirmacao, setConfirmacao] = useState<ConfirmacaoPedido | null>(null)

  const enviar = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (enviando) return

    const entrada = { tipo, nome, contato, descricao, prestadorId, website }
    const validacao = validarPedidoTitular(entrada)
    if (!validacao.ok) {
      setErros(validacao.erros)
      setErroGeral('')
      return
    }

    setEnviando(true)
    setErros({})
    setErroGeral('')
    try {
      setConfirmacao(await enviarPedidoTitular(entrada))
    } catch (err) {
      if (err instanceof ErroPedidoTitular && err.status === 400 && err.erros) {
        setErros(err.erros)
      } else if (err instanceof ErroPedidoTitular && err.status === 429) {
        setErroGeral('Muitos pedidos em pouco tempo. Tente novamente mais tarde.')
      } else {
        setErroGeral('Não foi possível enviar agora. Tente novamente ou escreva para o e-mail de privacidade.')
      }
    } finally {
      setEnviando(false)
    }
  }, [enviando, tipo, nome, contato, descricao, prestadorId, website])

  return {
    tipo, setTipo, nome, setNome, contato, setContato, descricao, setDescricao, website, setWebsite,
    enviando, erros, erroGeral, confirmacao, enviar,
  }
}
