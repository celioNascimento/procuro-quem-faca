// lib/trabalho/visibilidade.ts
//
// Regra que o prestador precisa entender: as fotos de um trabalho só aparecem no perfil público
// DEPOIS que o cliente aceita. Até lá, só o prestador e o cliente veem. O banco garante isso
// (migration 20261113220000); aqui ficam os textos que explicam, em palavras simples.

export interface VisibilidadeDasFotos {
  /** Já aparecem para quem visita o perfil? */
  publico: boolean
  titulo: string
  texto: string
  /** Versão curta, para listas. */
  resumo: string
}

export function visibilidadeDasFotos(status: string | null | undefined): VisibilidadeDasFotos {
  const s = (status ?? '').toLowerCase()
  if (s === 'em_execucao' || s === 'finalizado') {
    return {
      publico: true,
      titulo: 'Estas fotos já aparecem no seu perfil',
      texto: 'O cliente aceitou o trabalho, então quem visita o seu perfil já pode ver as fotos.',
      resumo: 'Aparece no seu perfil',
    }
  }
  return {
    publico: false,
    titulo: 'Estas fotos ainda não aparecem no seu perfil',
    texto:
      'Elas só ficam visíveis ao público depois que o cliente aceitar o trabalho. Até lá, só você e o cliente veem. ' +
      'Pode tirar e enviar as fotos com calma.',
    resumo: 'Aparece no perfil depois do aceite',
  }
}
