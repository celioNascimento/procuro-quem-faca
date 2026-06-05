import type { AdFallback } from '@/types/ads'
import type { SegmentoAd } from './categoria-segmento'

const NUMERO_WHATSAPP = '5543999739597' 
const MENSAGEM = encodeURIComponent('Olá! Tenho interesse em destacar minha loja no Procuro Quem Faça.')

const ROTA_CAPTACOES = () => `https://wa.me/${NUMERO_WHATSAPP}?text=${MENSAGEM}`

const FALLBACKS_POR_SEGMENTO: Record<SegmentoAd, AdFallback[]> = {
  construcao: [{
    emoji: '📢',
    titulo: 'Destaque sua loja de materiais aqui',
    subtitulo: 'Apareça exatamente quando clientes de Londrina buscam pedreiros.',
    cta: 'Anunciar agora',
    href: ROTA_CAPTACOES,
    cor: 'from-orange-700 to-orange-800',
  }],
  pintura: [{
    emoji: '📢',
    titulo: 'Venda mais tintas em Londrina',
    subtitulo: 'Mostre sua loja para clientes que estão contratando pintores agora.',
    cta: 'Anunciar agora',
    href: ROTA_CAPTACOES,
    cor: 'from-yellow-600 to-orange-600',
  }],
  eletrica: [{
    emoji: '📢',
    titulo: 'Destaque sua loja de materiais elétricos',
    subtitulo: 'Anuncie para clientes que acabaram de buscar eletricistas na região.',
    cta: 'Anunciar agora',
    href: ROTA_CAPTACOES,
    cor: 'from-yellow-500 to-yellow-600',
  }],
  hidraulica: [{
    emoji: '📢',
    titulo: 'Sua loja de hidráulica neste espaço',
    subtitulo: 'Conecte sua marca a clientes contratando encanadores.',
    cta: 'Anunciar agora',
    href: ROTA_CAPTACOES,
    cor: 'from-blue-600 to-blue-700',
  }],
  limpeza: [{
    emoji: '📢',
    titulo: 'Fornece produtos de limpeza profissional?',
    subtitulo: 'Exiba seus produtos no perfil das melhores diaristas de Londrina.',
    cta: 'Anunciar agora',
    href: ROTA_CAPTACOES,
    cor: 'from-teal-600 to-teal-700',
  }],
  jardinagem: [{
    emoji: '📢',
    titulo: 'Vende ferramentas e plantas?',
    subtitulo: 'Anuncie diretamente para quem está contratando jardineiros.',
    cta: 'Anunciar agora',
    href: ROTA_CAPTACOES,
    cor: 'from-green-700 to-green-800',
  }],
  informatica: [{
    emoji: '📢',
    titulo: 'Sua loja de informática em destaque',
    subtitulo: 'Apareça para clientes que buscam suporte técnico e consertos.',
    cta: 'Anunciar agora',
    href: ROTA_CAPTACOES,
    cor: 'from-slate-600 to-slate-700',
  }],
  geral: [
    {
      emoji: '🚀',
      titulo: 'Seu negócio visto por quem precisa',
      subtitulo: 'Anuncie no Procuro Quem Faça e alcance clientes no momento da decisão.',
      cta: 'Ver planos de anúncio',
      href: ROTA_CAPTACOES,
      cor: 'from-indigo-600 to-blue-700',
    }
  ],
}

export function getFallbackPorSegmento(segmento: SegmentoAd): AdFallback {
  const list = FALLBACKS_POR_SEGMENTO[segmento]
  return list[Math.floor(Math.random() * list.length)]
}