'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, ChevronRight, Globe } from 'lucide-react'

export default function PrestadorCard({ prestador, session, registrarLog }) {
  const [imgError, setImgError] = useState(false)
  const router = useRouter()

  if (!prestador) return null

  const isPublico = prestador.origem_tipo === 'curadoria_publica'
  const isVitrine = prestador.origem_tipo === 'vitrine'

  const fromUrl = typeof window !== 'undefined'
    ? window.location.pathname + window.location.search
    : '/prestadores'
  const perfilHref = `/${prestador.slug || prestador.id}?from=${encodeURIComponent(fromUrl)}`

  const getIniciais = (nome) => {
    if (!nome) return '?'
    const partes = nome.trim().split(/\s+/)
    if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase()
    return partes[0][0].toUpperCase()
  }

  const localizacao = [prestador.bairro, prestador.cidades?.nome]
    .filter(Boolean).join(' • ') || ''

  const habilidades = (prestador.habilidades || []).slice(0, 2)
  const extras      = (prestador.habilidades?.length || 0) - 2

  return (
    <Link
      href={perfilHref}
      onClick={() => registrarLog?.('CLIQUE_PERFIL', { nome: prestador.nome })}
      className={`group relative block bg-white rounded-[2rem] border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${
        isVitrine ? 'border-blue-200' : 'border-slate-100'
      }`}
    >
      {/* Faixa lateral vitrine — mais presença que h-0.5 no topo */}
      {isVitrine && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-l-[2rem]" />
      )}

      <div className={`px-5 py-4 flex items-center gap-4 ${isVitrine ? 'pl-6' : ''}`}>

        {/* ── Foto ── */}
        <div className="w-14 h-14 rounded-2xl bg-slate-50 overflow-hidden border border-slate-100 flex items-center justify-center shrink-0">
          {prestador.foto_perfil && !imgError ? (
            <img
              src={prestador.foto_perfil}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              alt={prestador.nome}
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-base font-black text-slate-300">
              {getIniciais(prestador.nome)}
            </span>
          )}
        </div>

        {/* ── Textos ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">

          {/* Nome — máx 2 linhas, peso controlado */}
          <h3 className="font-black text-slate-900 text-[15px] leading-snug tracking-tight line-clamp-2">
            {prestador.nome}
          </h3>
          {isVitrine && (
            <span className="w-fit inline-flex items-center gap-1 bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
              ✦ Perfil exemplo
            </span>
          )}

          {/* Categoria */}
          <span className="text-blue-600 text-[10px] font-black uppercase tracking-widest leading-none">
            {prestador.categoria}
          </span>

          {/* Habilidades */}
          {habilidades.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {habilidades.map(hab => (
                <span key={hab} className="text-[8px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                  {hab}
                </span>
              ))}
              {extras > 0 && (
                <span className="text-[8px] font-semibold text-slate-400 px-1">+{extras}</span>
              )}
            </div>
          )}

          {/* Localização + badge público na mesma linha */}
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {localizacao && (
              <div className="flex items-center gap-1">
                <MapPin size={9} className="shrink-0 text-slate-300" />
                <p className="text-[10px] font-medium text-slate-400 tracking-tight">
                  {localizacao}
                </p>
              </div>
            )}
            {/* Badge transparência — discreto mas presente */}
            {isPublico && !isVitrine && (
              <span className="flex items-center gap-1 text-[8px] font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-full">
                <Globe size={7} /> Perfil público
              </span>
            )}
          </div>

        </div>

        {/* ── Ver Perfil — coluna direita, centralizado ── */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          <span className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider group-hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 whitespace-nowrap">
            Ver perfil <ChevronRight size={10} strokeWidth={3} />
          </span>

          {/* Reivindique — só aparece para curadoria, abaixo do botão */}
          {isPublico && !isVitrine && (
            <span
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                router.push(`/reivindicar?id=${prestador.id}&nome=${encodeURIComponent(prestador.nome)}`)
              }}
              className="text-[8px] font-semibold text-slate-400 hover:text-blue-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              👋 É você?
            </span>
          )}
        </div>

      </div>
    </Link>
  )
}