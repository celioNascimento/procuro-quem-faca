'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

// Fallbacks rotativos — promovem a própria plataforma enquanto AdSense não aprova
const FALLBACKS = [
  {
    emoji: '🔧',
    titulo: 'Você é prestador de serviços?',
    subtitulo: 'Crie seu perfil grátis e apareça para centenas de clientes em Londrina.',
    cta: 'Cadastrar agora',
    href: '/cadastro',
    cor: 'from-blue-600 to-blue-700',
  },
  {
    emoji: '⭐',
    titulo: 'Serviço concluído?',
    subtitulo: 'Avalie o profissional e ajude outros clientes a encontrar bons prestadores.',
    cta: 'Ver meus projetos',
    href: '/meus-servicos',
    cor: 'from-indigo-600 to-blue-600',
  },
  {
    emoji: '📋',
    titulo: 'Precisa de um orçamento?',
    subtitulo: 'Encontre profissionais verificados para qualquer tipo de serviço.',
    cta: 'Buscar profissionais',
    href: '/prestadores',
    cor: 'from-slate-700 to-slate-800',
  },
]

export default function AnuncioCard({ anuncio }) {
  const adRef      = useRef(null)
  const [mostrarFallback, setMostrarFallback] = useState(false)
  const [fallback] = useState(() => FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)])

  // Detecta se o AdSense preencheu o slot após 2s
  // Se a altura do ins continuar 0, exibe o fallback
  useEffect(() => {
    if (!anuncio?.adsense_slot) {
      setMostrarFallback(true)
      return
    }

    const timer = setTimeout(() => {
      const el = adRef.current
      if (!el) { setMostrarFallback(true); return }
      const filled = el.offsetHeight > 10
      if (!filled) setMostrarFallback(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [anuncio])

  // ── AdSense com script ────────────────────────────────────────────────────
  if (anuncio?.adsense_slot && !mostrarFallback) {
    return (
      <div className="my-2 min-h-[100px] w-full" ref={adRef}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={anuncio.adsense_client || 'ca-pub-XXXXXXXXXXXXXXXX'}
          data-ad-slot={anuncio.adsense_slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    )
  }

  // ── Fallback — card de CTA da plataforma ──────────────────────────────────
  return (
    <Link
      href={fallback.href}
      className={`block w-full my-2 bg-gradient-to-r ${fallback.cor} rounded-[2.5rem] p-5 text-white shadow-xl active:scale-[0.98] transition-all`}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center text-2xl shrink-0">
          {fallback.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-[13px] uppercase italic tracking-tight leading-snug">
            {fallback.titulo}
          </p>
          <p className="text-white/70 text-[10px] font-medium mt-0.5 leading-snug">
            {fallback.subtitulo}
          </p>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <span className="bg-white/20 border border-white/30 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full">
          {fallback.cta} →
        </span>
      </div>
    </Link>
  )
}