'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, ChevronRight } from 'lucide-react'

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

  const habilidades = (prestador.habilidades || []).slice(0, 3)
  const extras      = (prestador.habilidades?.length || 0) - 3

  return (
    <Link
      href={perfilHref}
      onClick={() => registrarLog?.('CLIQUE_PERFIL', { nome: prestador.nome })}
      className={`group block bg-white rounded-[2rem] border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${
        isVitrine  ? 'border-blue-200' :
        isPublico  ? 'border-slate-100' :
                     'border-blue-50'
      }`}
    >
      {/* Faixa de destaque — só vitrine */}
      {isVitrine && (
        <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
      )}

      <div className="p-5 flex gap-4">

        {/* ── Foto ── */}
        <div className="shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 overflow-hidden border border-slate-100 shadow-sm flex items-center justify-center">
            {prestador.foto_perfil && !imgError ? (
              <img
                src={prestador.foto_perfil}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                alt={prestador.nome}
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-lg font-black text-slate-300 tracking-tighter">
                {getIniciais(prestador.nome)}
              </span>
            )}
          </div>
        </div>

        {/* ── Conteúdo ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">

          {/* Nome + botão na mesma linha — nome tem prioridade, botão shrink-0 */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-black text-slate-900 text-[17px] leading-snug tracking-tight">
              {prestador.nome}
              {isVitrine && (
                <span className="ml-2 align-middle bg-blue-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                  ✦ Exemplo
                </span>
              )}
            </h3>
            <span className="shrink-0 mt-0.5 flex items-center gap-1 bg-blue-600 text-white px-3.5 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider group-hover:bg-blue-700 transition-all shadow-md shadow-blue-100 whitespace-nowrap">
              Ver perfil <ChevronRight size={11} strokeWidth={3} />
            </span>
          </div>

          {/* Categoria */}
          <span className="text-blue-600 text-[10px] font-black uppercase tracking-widest leading-none">
            {prestador.categoria}
          </span>

          {/* Habilidades */}
          {habilidades.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {habilidades.map(hab => (
                <span key={hab} className="text-[9px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  {hab}
                </span>
              ))}
              {extras > 0 && (
                <span className="text-[9px] font-semibold text-slate-400 px-1 py-0.5">+{extras}</span>
              )}
            </div>
          )}

          {/* Localização */}
          {localizacao && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={9} className="shrink-0 text-slate-300" />
              <p className="text-[10px] font-medium text-slate-400 tracking-tight">
                {localizacao}
              </p>
            </div>
          )}

          {/* Reivindique — pill discreto, só para curadoria pública */}
          {isPublico && !isVitrine && (
            <span
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                router.push(`/reivindicar?id=${prestador.id}&nome=${encodeURIComponent(prestador.nome)}`)
              }}
              className="mt-0.5 w-fit flex items-center gap-1 text-[9px] font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all cursor-pointer"
            >
              👋 Este é você?
            </span>
          )}

        </div>
      </div>
    </Link>
  )
}