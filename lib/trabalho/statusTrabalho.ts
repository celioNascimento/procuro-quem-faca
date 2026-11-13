// lib/trabalho/statusTrabalho.ts
//
// O banco guarda o estado do trabalho com palavras técnicas ("em_registro", "pendente"...). O prestador
// vê sempre o texto em linguagem simples e a cor que combina com ele.

export type TomDoSelo = 'neutro' | 'aviso' | 'sucesso' | 'andamento'

export interface SeloDoTrabalho {
  texto: string
  tom: TomDoSelo
}

export interface EntradaDoSelo {
  status: string | null | undefined
  /** Prestador já terminou o serviço e falta o cliente avaliar. */
  aguardandoAvaliacao?: boolean
  /** Caso aberto depois da conclusão. */
  caso?: 'garantia' | 'reclamacao' | null
}

export function seloDoTrabalho({ status, aguardandoAvaliacao = false, caso = null }: EntradaDoSelo): SeloDoTrabalho {
  if (caso === 'reclamacao') return { texto: 'Reclamação recebida', tom: 'aviso' }
  if (caso === 'garantia') return { texto: 'Garantia acionada', tom: 'aviso' }

  switch ((status ?? '').toLowerCase()) {
    case 'finalizado':
      return { texto: 'Concluído e avaliado', tom: 'sucesso' }
    case 'em_disputa':
      return { texto: 'Em análise pela equipe', tom: 'aviso' }
    case 'em_execucao':
      return aguardandoAvaliacao
        ? { texto: 'Aguardando a avaliação do cliente', tom: 'andamento' }
        : { texto: 'Em andamento', tom: 'andamento' }
    case 'pendente':
    case 'aguardando_aceite':
      return { texto: 'Aguardando o cliente aceitar', tom: 'aviso' }
    case 'em_registro':
      return { texto: 'Rascunho: ainda não enviado ao cliente', tom: 'neutro' }
    default:
      return { texto: 'Novo trabalho', tom: 'neutro' }
  }
}
