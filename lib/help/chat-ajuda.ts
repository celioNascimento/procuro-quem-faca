// lib/help/chat-ajuda.ts
// Lógica do chat guiado da Ajuda (sem IA): acha os artigos que combinam com o que a pessoa escreveu.
import { NUMERO_WHATSAPP_PQF } from '@/lib/config/contato'
import { getHelpArticles, type HelpArticle, type HelpAudience } from '@/lib/help/help-content'

const PALAVRAS_SEM_VALOR = new Set([
  'como', 'para', 'por', 'que', 'uma', 'uns', 'umas', 'dos', 'das', 'nos', 'nas', 'com', 'sem', 'meu', 'minha',
  'meus', 'minhas', 'seu', 'sua', 'quero', 'queria', 'preciso', 'posso', 'faco', 'fazer', 'sobre', 'esta',
  'estou', 'tenho', 'foi', 'ser', 'tem', 'isso', 'esse', 'essa', 'mais', 'muito', 'ajuda', 'duvida', 'onde',
  'qual', 'quais', 'quando', 'porque', 'aqui', 'site', 'pqf',
])

/** Minúsculas, sem acento e sem pontuação. */
export function normalizarTexto(texto: string): string {
  return texto
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function palavrasDaPergunta(pergunta: string): string[] {
  return normalizarTexto(pergunta)
    .split(' ')
    .filter((p) => p.length > 2 && !PALAVRAS_SEM_VALOR.has(p))
}

// "avaliar", "avaliação" e "avalio" têm o mesmo começo: comparamos pelo início da palavra.
function combina(texto: string, palavra: string): boolean {
  if (texto.includes(palavra)) return true
  return palavra.length >= 6 && texto.includes(palavra.slice(0, 5))
}

/** Artigos que respondem à pergunta, do mais ao menos provável. Vazio quando nada combina. */
export function buscarRespostas(pergunta: string, audience: HelpAudience, limite = 3): HelpArticle[] {
  const palavras = palavrasDaPergunta(pergunta)
  if (!palavras.length) return []

  return getHelpArticles(audience)
    .map((artigo) => {
      const titulo = normalizarTexto(artigo.title)
      const resumo = normalizarTexto(artigo.summary)
      const categoria = normalizarTexto(artigo.category)
      const passos = normalizarTexto((artigo.steps ?? []).join(' '))
      let pontos = 0
      for (const palavra of palavras) {
        if (combina(titulo, palavra)) pontos += 3
        if (combina(resumo, palavra)) pontos += 2
        if (combina(categoria, palavra)) pontos += 1
        if (combina(passos, palavra)) pontos += 1
      }
      return { artigo, pontos }
    })
    .filter((item) => item.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, limite)
    .map((item) => item.artigo)
}

/** Primeiras opções do chat: as da tela de onde a pessoa veio e, se faltar, as demais do público. */
export function sugestoesIniciais(audience: HelpAudience, context?: string, limite = 4): HelpArticle[] {
  const doContexto = context ? getHelpArticles(audience, context) : []
  const restantes = getHelpArticles(audience).filter((a) => !doContexto.some((c) => c.id === a.id))
  return [...doContexto, ...restantes].slice(0, limite)
}

/** Link do WhatsApp do PQF com a dúvida já escrita. Não leva nenhum dado da pessoa. */
export function linkWhatsappSuporte(audience: HelpAudience, pergunta?: string): string {
  const quem = audience === 'prestador' ? 'Sou prestador' : 'Sou cliente'
  const duvida = pergunta?.trim() ? ` Minha dúvida: ${pergunta.trim().slice(0, 300)}` : ''
  const mensagem = `Olá! ${quem} e preciso de ajuda no Procuro Quem Faça.${duvida}`
  return `https://wa.me/${NUMERO_WHATSAPP_PQF}?text=${encodeURIComponent(mensagem)}`
}
