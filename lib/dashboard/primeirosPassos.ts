// lib/dashboard/primeirosPassos.ts
//
// "Primeiros passos" do painel do prestador: três etapas que levam um perfil recém-criado a
// receber contato. O primeiro passo (perfil no ar) já nasce concluído, porque o cadastro entra no
// ar sem aprovação; os outros dois dependem do que o prestador de fato fez.

export type IdPasso = 'perfil' | 'vitrine' | 'trabalho'

export interface Passo {
  id: IdPasso
  titulo: string
  descricao: string
  concluido: boolean
}

export interface SituacaoDoPainel {
  temFotosNaVitrine: boolean
  temTrabalhos: boolean
}

export function listarPassos({ temFotosNaVitrine, temTrabalhos }: SituacaoDoPainel): Passo[] {
  return [
    {
      id: 'perfil',
      titulo: 'Seu perfil já está no ar',
      descricao: 'Copie o link e mande para seus clientes pelo WhatsApp.',
      concluido: true,
    },
    {
      id: 'vitrine',
      titulo: 'Mostre fotos do que você faz',
      descricao: 'Adicione até 5 fotos na sua vitrine. Não precisa de cliente.',
      concluido: temFotosNaVitrine,
    },
    {
      id: 'trabalho',
      titulo: 'Registre seu primeiro trabalho com um cliente',
      descricao: 'O cliente recebe um link, aceita o trabalho e depois avalia. É isso que dá confiança ao seu perfil.',
      concluido: temTrabalhos,
    },
  ]
}

export function totalConcluidos(passos: Passo[]): number {
  return passos.filter((p) => p.concluido).length
}

export function todosConcluidos(passos: Passo[]): boolean {
  return passos.every((p) => p.concluido)
}
