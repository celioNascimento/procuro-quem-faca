// hooks/useWizardWhatsappLinks.ts
//
// Links de WhatsApp do wizard de projeto: convite de acompanhamento
// (gerarLinkAceite) e link de avaliação na conclusão (gerarLinkConclusao).

import { atualizarStatusProjeto, getStatusETokenProjeto } from '@/lib/services/uploadWizard.service'

interface Params {
  projetoId: string | null
  projetoStatus: string
  clienteWhatsapp: string
  clienteNome: string
  titulo: string
  setLinkGerado: (v: boolean) => void
  setProjetoStatus: (v: string) => void
}

export function useWizardWhatsappLinks({
  projetoId, projetoStatus, clienteWhatsapp, clienteNome, titulo,
  setLinkGerado, setProjetoStatus,
}: Params) {
  const gerarLinkAceite = async () => {
    setLinkGerado(true)
    if (projetoId) {
      const currentId = projetoId
      if (projetoStatus === 'em_registro') {
        await atualizarStatusProjeto(currentId, 'pendente')
        setProjetoStatus('pendente')
      }
      const projData = await getStatusETokenProjeto(currentId)
      const token = projData?.avaliacao_token
      const numTelefone = clienteWhatsapp.replace(/\D/g, '')
      const linkProjeto = `${window.location.origin}/meus-servicos${token ? `?token=${token}` : ''}`
      const mensagem = `Olá${clienteNome ? `, ${clienteNome}` : ''}! 👋\n\nRegistramos o início do serviço *${titulo}* e preparamos um acompanhamento exclusivo para você.\n\nPor este link você visualiza as fotos de cada etapa e pode deixar comentários em tempo real:\n\n🔗 ${linkProjeto}\n\nAssim que confirmar o início, seguimos com o serviço. Qualquer dúvida, é só chamar!`
      window.open(`https://wa.me/55${numTelefone}?text=${encodeURIComponent(mensagem)}`, '_blank')
    }
  }

  const gerarLinkConclusao = async () => {
    if (!projetoId) return
    const projData = await getStatusETokenProjeto(projetoId)
    const token = projData?.avaliacao_token
    const numTelefone = clienteWhatsapp.replace(/\D/g, '')
    const linkAvaliacao = `${window.location.origin}/avaliar/${token}`
    const mensagem = `Olá${clienteNome ? `, ${clienteNome}` : ''}! 🎉\n\nO serviço *${titulo}* foi concluído com sucesso!\n\nAcesse o link abaixo para conferir as fotos do resultado final e deixar sua avaliação — ela é muito importante para nós:\n\n🔗 ${linkAvaliacao}\n\nFoi um prazer trabalhar com você!`
    window.open(`https://wa.me/55${numTelefone}?text=${encodeURIComponent(mensagem)}`, '_blank')
  }

  return { gerarLinkAceite, gerarLinkConclusao }
}
