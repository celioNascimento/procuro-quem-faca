// lib/divulgacao/mensagens.ts
import type { DadosDivulgacao } from './tipos'

export interface MensagemPronta {
  id: string
  titulo: string
  quando: string
  texto: string
}

function plural(n: number, s: string, p: string) {
  return n === 1 ? s : p
}

/** Mensagens prontas para WhatsApp/redes. Só cita números que existem (nunca "0 indicações"). */
export function gerarMensagens(dados: DadosDivulgacao, link: string): MensagemPronta[] {
  const local = dados.cidade ? ` em ${dados.cidade}` : ' na região'
  const prova: string[] = []
  if (dados.totalIndicacoes > 0) {
    prova.push(`${dados.totalIndicacoes} ${plural(dados.totalIndicacoes, 'cliente indicou', 'clientes indicaram')} meu trabalho`)
  }
  if (dados.totalConcluidos > 0) {
    prova.push(`${dados.totalConcluidos} ${plural(dados.totalConcluidos, 'serviço concluído', 'serviços concluídos')} com fotos`)
  }
  if (dados.garantiaDias > 0) prova.push(`${dados.garantiaDias} dias de garantia`)
  const linhaProva = prova.length > 0 ? `\n\n✅ ${prova.join('\n✅ ')}` : ''
  const categoria = dados.categoria ? ` de ${dados.categoria.toLowerCase()}` : ''

  return [
    {
      id: 'portfolio',
      titulo: 'Portfólio completo',
      quando: 'Quando alguém pergunta "você faz isso?" ou pede referências.',
      texto: `Olá! Aqui está o meu portfólio completo de serviços e avaliações de clientes${local}:\n${link}${linhaProva}`,
    },
    {
      id: 'orcamento',
      titulo: 'Responder pedido de orçamento',
      quando: 'Logo depois do primeiro contato, antes de combinar valores.',
      texto: `Olá! Obrigado pelo contato. Antes de combinarmos, vale conhecer meu trabalho: fotos de serviços reais e indicações de clientes${local}.\n${link}\n\nMe conta o que você precisa que eu já te passo uma ideia de prazo e valor.`,
    },
    {
      id: 'status',
      titulo: 'Texto para Status / Stories',
      quando: 'Para acompanhar a imagem do cartão digital.',
      texto: `Profissional${categoria}${local}. Veja meus serviços, fotos e o que os clientes dizem:\n${link}`,
    },
    {
      id: 'grupos',
      titulo: 'Grupos de bairro e condomínio',
      quando: 'Para divulgar em grupos onde a regra permite (sem spam).',
      texto: `Pessoal, trabalho${categoria}${local}. Quem precisar, deixo meu perfil com fotos dos serviços e indicações de clientes:\n${link}`,
    },
  ]
}
