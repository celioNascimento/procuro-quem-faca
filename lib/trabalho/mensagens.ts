// lib/trabalho/mensagens.ts
//
// Textos das mensagens que o prestador manda ao cliente. Ficam aqui, separados do envio, para a tela
// poder mostrar a prévia do que o cliente vai receber e o prestador poder copiar o texto.

interface DadosDaMensagem {
  clienteNome?: string | null
  titulo: string
  link: string
}

const saudacao = (nome?: string | null) => `Olá${nome && nome.trim() ? `, ${nome.trim()}` : ''}!`

export function mensagemDeAceite({ clienteNome, titulo, link }: DadosDaMensagem): string {
  return (
    `${saudacao(clienteNome)} 👋\n\n` +
    `Registramos o início do serviço *${titulo}* e preparamos um acompanhamento exclusivo para você.\n\n` +
    `Por este link você visualiza as fotos de cada etapa e pode deixar comentários em tempo real:\n\n` +
    `🔗 ${link}\n\n` +
    `Assim que confirmar o início, seguimos com o serviço. Qualquer dúvida, é só chamar!`
  )
}

export function mensagemDeConclusao({ clienteNome, titulo, link }: DadosDaMensagem): string {
  return (
    `${saudacao(clienteNome)} 🎉\n\n` +
    `O serviço *${titulo}* foi concluído com sucesso!\n\n` +
    `Acesse o link abaixo para conferir as fotos do resultado final e deixar sua avaliação — ela é muito importante para nós:\n\n` +
    `🔗 ${link}\n\n` +
    `Foi um prazer trabalhar com você!`
  )
}

/** Endereço do WhatsApp (Brasil) já com o texto pronto. Sem telefone válido devolve null. */
export function enderecoDoWhatsapp(telefone: string, mensagem: string): string | null {
  const numero = telefone.replace(/\D/g, '')
  if (numero.length < 10) return null
  return `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`
}
