'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin } from 'lucide-react'

export default function PrestadorCard({ prestador, session, registrarLog }) {
  const [imgError, setImgError] = useState(false)
  const router = useRouter()

  if (!prestador) return null

  const isPublico = prestador.origem_tipo === 'curadoria_publica'

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
    .filter(Boolean)
    .join(' • ') || 'Localização não informada'

  const todasHabilidades = prestador.habilidades || []
  const habilidadesVisiveis = todasHabilidades.slice(0, 3)
  const habilidadesExtras   = todasHabilidades.length - 3

  return (
    <Link
      href={perfilHref}
      onClick={() => registrarLog?.('CLIQUE_PERFIL', { nome: prestador.nome })}
      className={`block bg-white border p-5 md:p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all group cursor-pointer ${
        isPublico ? 'border-slate-100' : 'border-blue-50'
      }`}
    >
      {/* min-h fixa a altura mínima do card — não muda se "É você?" aparece ou não */}
      <div className="flex items-stretch justify-between gap-4 min-h-[72px]">

        {/* ── Esquerda: foto + textos ── */}
        <div className="flex items-center gap-4 flex-1 min-w-0">

          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100 shadow-sm flex items-center justify-center">
            {prestador.foto_perfil && !imgError ? (
              <img
                src={prestador.foto_perfil}
                className="w-full h-full object-cover"
                alt={prestador.nome}
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-sm font-black text-slate-400 tracking-tighter">
                {getIniciais(prestador.nome)}
              </span>
            )}
          </div>

          <div className="flex flex-col flex-1 min-w-0 gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 text-base md:text-lg tracking-tight leading-tight truncate">
                {prestador.nome}
              </h3>
              {isPublico && (
                <span className="bg-slate-100 text-slate-400 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0 whitespace-nowrap">
                  Perfil público
                </span>
              )}
            </div>

            <span className="text-blue-600 text-[10px] md:text-[11px] font-black uppercase tracking-widest">
              {prestador.categoria}
            </span>

            {/* Área de habilidades com altura fixa — card não muda de tamanho */}
            <div className="flex flex-wrap gap-1 min-h-[20px]">
              {habilidadesVisiveis.map(hab => (
                <span
                  key={hab}
                  className="text-[9px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wide"
                >
                  {hab}
                </span>
              ))}
              {habilidadesExtras > 0 && (
                <span className="text-[9px] font-semibold text-slate-400 px-1 py-0.5">
                  +{habilidadesExtras}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <MapPin size={10} className="shrink-0 text-slate-300" />
              <p className="text-[10px] md:text-[11px] font-medium text-slate-400 tracking-tight truncate">
                {localizacao}
              </p>
            </div>
          </div>
        </div>

        {/* ── Direita: ações ──────────────────────────────────────────────────
            flex-col + justify-between + self-stretch:
            - self-stretch: ocupa toda a altura do card (items-stretch no pai)
            - justify-between: "É você?" no topo, "Ver Perfil" sempre na base
            - Quando isPublico=false: só "Ver Perfil" existe → justify-between
              com um único filho o empurra para baixo com mt-auto
            Resultado: "Ver Perfil" sempre ancorado na base, card sempre mesmo tamanho */}
        <div className="flex flex-col justify-between items-end self-stretch shrink-0 gap-2">

          {/* Espaçador invisível quando não é público — garante que Ver Perfil
              sempre fique na base independente de ter ou não o link de reivindicação */}
          {isPublico ? (
            <span
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                router.push(`/reivindicar?id=${prestador.id}&nome=${encodeURIComponent(prestador.nome)}`)
              }}
              className="text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors whitespace-nowrap cursor-pointer"
            >
              É você? Reivindique
            </span>
          ) : (
            <span /> // espaçador vazio — mantém Ver Perfil na base
          )}

          <span className="bg-blue-600 text-white px-5 py-2.5 md:px-6 md:py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] group-hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 whitespace-nowrap">
            Ver Perfil
          </span>
        </div>

      </div>
    </Link>
  )
}