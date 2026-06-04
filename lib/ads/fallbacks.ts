import type { AdFallback } from '@/types/ads'
import type { SegmentoAd } from './categoria-segmento'

const FALLBACKS_POR_SEGMENTO: Record<SegmentoAd, AdFallback[]> = {
  construcao: [{
    emoji: '🧱',
    titulo: 'Precisa de material de construção?',
    subtitulo: 'Cimento, tijolo, areia — entrega em Londrina.',
    cta: 'Ver fornecedores',
    href: () => '/parceiros?segmento=construcao',
    cor: 'from-orange-700 to-orange-800',
  }],
  pintura: [{
    emoji: '🎨',
    titulo: 'Tintas com entrega rápida',
    subtitulo: 'Suvinil, Coral — escolha a cor certa.',
    cta: 'Ver tintas',
    href: () => '/parceiros?segmento=pintura',
    cor: 'from-yellow-600 to-orange-600',
  }],
  eletrica: [{
    emoji: '⚡',
    titulo: 'Material elétrico em Londrina',
    subtitulo: 'Fios, disjuntores, tomadas.',
    cta: 'Ver materiais',
    href: () => '/parceiros?segmento=eletrica',
    cor: 'from-yellow-500 to-yellow-600',
  }],
  hidraulica: [{
    emoji: '🔩',
    titulo: 'Tubos, conexões e registros',
    subtitulo: 'Material hidráulico para sua obra.',
    cta: 'Ver fornecedores',
    href: () => '/parceiros?segmento=hidraulica',
    cor: 'from-blue-600 to-blue-700',
  }],
  limpeza: [{
    emoji: '🧹',
    titulo: 'Produtos de limpeza profissional',
    subtitulo: 'Para quem exige resultado de verdade.',
    cta: 'Ver produtos',
    href: () => '/parceiros?segmento=limpeza',
    cor: 'from-teal-600 to-teal-700',
  }],
  jardinagem: [{
    emoji: '🌿',
    titulo: 'Ferramentas para jardim',
    subtitulo: 'Tudo para manter o verde em ordem.',
    cta: 'Ver produtos',
    href: () => '/parceiros?segmento=jardinagem',
    cor: 'from-green-700 to-green-800',
  }],
  informatica: [{
    emoji: '💻',
    titulo: 'Peças e acessórios de informática',
    subtitulo: 'Memória, SSD, cabos — entrega rápida.',
    cta: 'Ver produtos',
    href: () => '/parceiros?segmento=informatica',
    cor: 'from-slate-600 to-slate-700',
  }],
  geral: [
    {
      emoji: '🔧',
      titulo: 'Você é prestador de serviços?',
      subtitulo: 'Crie seu perfil grátis e apareça para clientes em Londrina.',
      cta: 'Cadastrar agora',
      href: () => '/cadastro',
      cor: 'from-blue-600 to-blue-700',
    },
    {
      emoji: '⭐',
      titulo: 'Serviço concluído?',
      subtitulo: 'Avalie o profissional e ajude outros clientes.',
      cta: 'Ver meus projetos',
      href: () => '/meus-servicos',
      cor: 'from-indigo-600 to-blue-600',
    },
  ],
}

export function getFallbackPorSegmento(segmento: SegmentoAd): AdFallback {
  const list = FALLBACKS_POR_SEGMENTO[segmento]
  return list[Math.floor(Math.random() * list.length)]
}