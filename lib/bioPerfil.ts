// lib/bioPerfil.ts
//
// O que aparece em "Sobre o profissional". Os perfis montados com dados públicos (curadoria) nasceram com a
// mesma frase pronta ("Profissional qualificado disponível para atendimentos na região."): mostrada como
// bio, ela não diz nada sobre a pessoa. Nesse caso (ou sem bio) usamos uma frase feita só com dados que o
// perfil já tem: a categoria e a cidade. Quando o profissional escreve a própria bio, ela aparece no lugar.

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Frase padrão do cadastro automático (e variações curtas começando igual). Texto longo nunca é tratado como padrão. */
export function ehBioGenerica(bio?: string | null): boolean {
  if (!bio || !bio.trim()) return true
  const t = normalizar(bio)
  return t.startsWith('profissional qualificado') && t.length <= 90
}

type Dados = {
  bio?: string | null
  categoria?: string | null
  cidade?: string | null
}

export type BioExibida = { texto: string; automatica: boolean }

/** Devolve o texto a mostrar, ou null quando não há nada útil (a seção então não aparece). */
export function bioParaExibir({ bio, categoria, cidade }: Dados): BioExibida | null {
  if (!ehBioGenerica(bio)) return { texto: (bio as string).trim(), automatica: false }

  const funcao = categoria?.trim()
  const local = cidade?.trim()
  if (funcao && local) return { texto: `${funcao} em ${local}.`, automatica: true }
  if (funcao) return { texto: `${funcao}.`, automatica: true }
  return null
}
