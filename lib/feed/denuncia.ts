// lib/feed/denuncia.ts
// Denúncia de um trabalho do feed: o endereço leva o id e o título do trabalho para a página de denúncia
// do prestador (que já existe), e o título vai junto no motivo para o moderador achar a foto. Sem acesso a banco.

export interface TrabalhoDenunciado { id: string; titulo: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TITULO_MAX = 100

function limparTitulo(t: string): string {
  return t.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, TITULO_MAX)
}

/** Endereço da página de denúncia já apontando para o trabalho. */
export function enderecoDaDenuncia(prestadorId: number, projetoId: string, titulo: string): string {
  return `/denunciar/${prestadorId}?trabalho=${encodeURIComponent(projetoId)}&titulo=${encodeURIComponent(limparTitulo(titulo))}`
}

/** Lê o trabalho do endereço. Id que não é um UUID (link adulterado) vira null: a denúncia segue só do prestador. */
export function lerTrabalhoDenunciado(params: { get(nome: string): string | null }): TrabalhoDenunciado | null {
  const id = params.get('trabalho')
  if (!id || !UUID.test(id)) return null
  return { id, titulo: limparTitulo(params.get('titulo') ?? '') || 'Trabalho sem título' }
}

/** Motivo gravado: com trabalho, começa dizendo qual foi. */
export function motivoDaDenuncia(motivo: string, trabalho: TrabalhoDenunciado | null): string {
  const texto = motivo.trim()
  if (!trabalho) return texto
  return `Sobre o trabalho "${trabalho.titulo}" (id ${trabalho.id}): ${texto}`
}
