// hooks/useWizardWhatsappLinks.ts
//
// Envio ao cliente na tela de novo trabalho: convite de acompanhamento/aceite e pedido de avaliação.
// Cada um pode ser enviado pelo WhatsApp ou copiado (para mandar por outro aplicativo).
//
// A janela do WhatsApp é aberta NO CLIQUE, antes de consultar o banco. Abrir depois de esperar uma
// resposta faz o navegador do celular bloquear a janela sem avisar.

import { atualizarStatusProjeto, getStatusETokenProjeto } from '@/lib/services/uploadWizard.service'
import { enderecoDoWhatsapp, mensagemDeAceite, mensagemDeConclusao } from '@/lib/trabalho/mensagens'

interface Params {
  projetoId: string | null
  projetoStatus: string
  clienteWhatsapp: string
  clienteNome: string
  titulo: string
  setLinkGerado: (v: boolean) => void
  setProjetoStatus: (v: string) => void
  /** Avisa a tela quando algo dá errado (mensagem já em linguagem simples). */
  aoErrar?: (mensagem: string) => void
}

type Montar = () => Promise<string | null>

export function useWizardWhatsappLinks({
  projetoId, projetoStatus, clienteWhatsapp, clienteNome, titulo,
  setLinkGerado, setProjetoStatus, aoErrar,
}: Params) {
  const tokenDoProjeto = async (id: string) => {
    const dados = await getStatusETokenProjeto(id)
    return dados?.avaliacao_token || ''
  }

  const montarAceite: Montar = async () => {
    setLinkGerado(true)
    if (!projetoId) return null
    if (projetoStatus === 'em_registro') {
      await atualizarStatusProjeto(projetoId, 'pendente')
      setProjetoStatus('pendente')
    }
    const token = await tokenDoProjeto(projetoId)
    const link = `${window.location.origin}/meus-servicos${token ? `?token=${token}` : ''}`
    return mensagemDeAceite({ clienteNome, titulo, link })
  }

  const montarConclusao: Montar = async () => {
    if (!projetoId) return null
    const token = await tokenDoProjeto(projetoId)
    const link = `${window.location.origin}/avaliar/${token}`
    return mensagemDeConclusao({ clienteNome, titulo, link })
  }

  const abrirWhatsapp = async (montar: Montar): Promise<boolean> => {
    const aba = window.open('', '_blank')
    try {
      const mensagem = await montar()
      const endereco = mensagem ? enderecoDoWhatsapp(clienteWhatsapp, mensagem) : null
      if (!endereco) {
        aba?.close()
        aoErrar?.('Confira o WhatsApp do cliente: ele precisa ter o DDD e o número completo.')
        return false
      }
      if (aba) aba.location.href = endereco
      else window.location.assign(endereco)
      return true
    } catch (erro) {
      aba?.close()
      console.error('[trabalho] erro ao preparar o envio pelo WhatsApp', erro)
      aoErrar?.('Não foi possível preparar o envio agora. Verifique a internet e tente de novo.')
      return false
    }
  }

  const copiarMensagem = async (montar: Montar): Promise<boolean> => {
    try {
      const mensagem = await montar()
      if (!mensagem) return false
      await navigator.clipboard.writeText(mensagem)
      return true
    } catch (erro) {
      console.error('[trabalho] erro ao copiar a mensagem', erro)
      aoErrar?.('Não consegui copiar. Tente enviar pelo WhatsApp.')
      return false
    }
  }

  return {
    gerarLinkAceite: () => abrirWhatsapp(montarAceite),
    gerarLinkConclusao: () => abrirWhatsapp(montarConclusao),
    copiarAceite: () => copiarMensagem(montarAceite),
    copiarConclusao: () => copiarMensagem(montarConclusao),
  }
}
