// lib/trabalho/passos.ts
//
// Passos da tela de novo trabalho e a frase "o que fazer agora". Existem dois caminhos: com fotos
// (Antes, Durante e Depois) e sem fotos (só aceite e avaliação). A tela sempre mostra em que passo a
// pessoa está e o que falta, para ninguém ficar parado sem saber o que fazer.

export type EstadoDoPasso = 'feito' | 'atual' | 'pendente'

export interface PassoDoTrabalho {
  id: string
  rotulo: string
  estado: EstadoDoPasso
}

export interface SituacaoDoTrabalho {
  semFotos: boolean
  /** WhatsApp do cliente válido e nome do serviço preenchido. */
  dadosValidos: boolean
  projetoCriado: boolean
  fotos: [boolean, boolean, boolean]
  /** Prestador já gerou o aceite para o cliente (fluxo com fotos). */
  aceiteEnviado: boolean
  status: string | null | undefined
  /** Prestador marcou o serviço como concluído (fluxo sem fotos). */
  marcadoConcluido: boolean
  /** Falta só o cliente avaliar. */
  aguardandoAvaliacao: boolean
  concluido: boolean
}

type Ponto = 'feito' | 'atual' | 'pendente'

/** Marca "feito" quando já passou, "atual" no primeiro que ainda falta e "pendente" nos seguintes. */
function marcar(passos: { id: string; rotulo: string; feito: boolean }[]): PassoDoTrabalho[] {
  let jaTemAtual = false
  return passos.map((p) => {
    let estado: Ponto
    if (p.feito) estado = 'feito'
    else if (!jaTemAtual) { estado = 'atual'; jaTemAtual = true }
    else estado = 'pendente'
    return { id: p.id, rotulo: p.rotulo, estado }
  })
}

const AINDA_PENDENTE = ['pendente', 'em_registro', 'aguardando_aceite']

export function passosDoTrabalho(s: SituacaoDoTrabalho): PassoDoTrabalho[] {
  if (s.semFotos) {
    const aceito = s.projetoCriado && !AINDA_PENDENTE.includes((s.status ?? '').toLowerCase())
    return marcar([
      { id: 'cliente', rotulo: 'Cliente e serviço', feito: s.projetoCriado },
      { id: 'aceite', rotulo: 'Aceite do cliente', feito: aceito },
      { id: 'concluir', rotulo: 'Concluir', feito: s.marcadoConcluido || s.concluido },
      { id: 'avaliacao', rotulo: 'Avaliação', feito: s.concluido },
    ])
  }
  const [antes, durante, depois] = s.fotos
  return marcar([
    { id: 'cliente', rotulo: 'Cliente e serviço', feito: s.dadosValidos },
    { id: 'antes', rotulo: 'Foto do antes', feito: antes },
    { id: 'aceite', rotulo: 'Aceite do cliente', feito: antes && s.aceiteEnviado },
    { id: 'fotos', rotulo: 'Durante e depois', feito: durante && depois },
    { id: 'avaliacao', rotulo: 'Avaliação', feito: s.concluido },
  ])
}

/** Frase única que diz o que fazer agora. */
export function proximaAcao(s: SituacaoDoTrabalho): string {
  if (s.concluido) return 'Trabalho concluído e avaliado. Ele já aparece no seu perfil.'

  if (s.semFotos) {
    if (!s.projetoCriado) return s.dadosValidos ? 'Toque em "Iniciar serviço".' : 'Preencha o WhatsApp do cliente e o nome do serviço.'
    if (AINDA_PENDENTE.includes((s.status ?? '').toLowerCase())) return 'Envie o aceite ao cliente.'
    if (!s.marcadoConcluido) return 'Quando terminar o serviço, marque como concluído.'
    return 'Peça a avaliação ao cliente.'
  }

  const [antes, durante, depois] = s.fotos
  if (!s.dadosValidos) return 'Preencha o WhatsApp do cliente e o nome do serviço.'
  if (!antes) return 'Adicione a foto do antes.'
  if (!s.aceiteEnviado) return 'Envie o aceite ao cliente.'
  if (!durante) return 'Adicione a foto do durante.'
  if (!depois) return 'Adicione a foto do depois.'
  return 'Peça a avaliação ao cliente.'
}
