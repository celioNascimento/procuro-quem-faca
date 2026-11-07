// components/Logo.tsx
//
// Fonte única da logo do PQF. Todo lugar que exibe a logo deve usar este componente.
//
// A logo (public/logo.png) é horizontal e o texto ocupa só a faixa central da altura
// (o ícone ocupa a altura toda). Por isso o tamanho é definido pela LARGURA, e não por
// h-* como era antes: dimensionar pela altura deixa o texto minúsculo.
//
// Se a logo mudar de novo: troque o arquivo em /public e ajuste LOGO_WIDTH / LOGO_HEIGHT
// (dimensões reais do PNG). Os tamanhos abaixo são relativos à largura e continuam valendo.

import Image from 'next/image'

const LOGO_SRC = '/logo.png'
const LOGO_WIDTH = 2172
const LOGO_HEIGHT = 647

export type LogoVariant = 'header' | 'nav' | 'hero' | 'auth' | 'card' | 'erro'

// `size`  → classes Tailwind de largura (mobile → tablet → desktop)
// `sizes` → dica para o next/image escolher a imagem otimizada certa (mesmos valores, em px)
const VARIANTS: Record<LogoVariant, { size: string; sizes: string }> = {
  // Header fixo (h-16 no mobile / h-28 no desktop): 176px → 288px
  header: { size: 'w-44 md:w-72', sizes: '(min-width: 768px) 288px, 176px' },
  // Barras mais baixas (cadastro, ajuda): 160px → 208px
  nav: { size: 'w-40 md:w-52', sizes: '(min-width: 768px) 208px, 160px' },
  // Home: logo em destaque acima da busca: 256px → 320px → 416px
  hero: {
    size: 'w-64 sm:w-80 md:w-[26rem]',
    sizes: '(min-width: 768px) 416px, (min-width: 640px) 320px, 256px',
  },
  // Card de login: 224px → 256px → 288px
  auth: {
    size: 'w-56 md:w-64 lg:w-72',
    sizes: '(min-width: 1024px) 288px, (min-width: 768px) 256px, 224px',
  },
  // Páginas de formulário simples (recuperar senha, acesso por link): 208px → 256px
  card: { size: 'w-52 md:w-64', sizes: '(min-width: 768px) 256px, 208px' },
  // Telas de erro / 404 / link expirado: 288px → 416px
  erro: { size: 'w-72 sm:w-[26rem]', sizes: '(min-width: 640px) 416px, 288px' },
}

interface LogoProps {
  variant: LogoVariant
  /** Classes extras (ex.: drop-shadow-sm, select-none). Não use largura/altura aqui. */
  className?: string
  /** Use true para a logo que aparece acima da dobra (header, home) */
  priority?: boolean
  alt?: string
}

export default function Logo({
  variant,
  className = '',
  priority = false,
  alt = 'Procuro Quem Faça',
}: LogoProps) {
  const { size, sizes } = VARIANTS[variant]

  return (
    <Image
      src={LOGO_SRC}
      alt={alt}
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      sizes={sizes}
      priority={priority}
      className={`${size} h-auto max-w-full object-contain ${className}`.trim()}
    />
  )
}
