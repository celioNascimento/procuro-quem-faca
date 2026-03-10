'use client'
import Link from 'next/link'
import { MapPin } from 'lucide-react'

// session vem como prop — evita N chamadas ao supabase.auth.getSession()
// em paralelo quando há múltiplos cards na lista.
// PaginaPrestadores deve buscar session uma vez e passar para cada card.
export default function PrestadorCard({ prestador, session, registrarLog }) {
  if (!prestador) return null

  const isPublico = prestador.origem_tipo === 'curadoria_publica'

  const getIniciais = (nome) => {
    if (!nome) return '?'
    const partes = nome.trim().split(/\s+/)
    if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase()
    return partes[0][0].toUpperCase()
  }

  // Localização com guard — bairro pode ser null
  const localizacao = [prestador.bairro, prestador.cidades?.nome || 'Londrina']
    .filter(Boolean)
    .join(' • ')

  // Habilidades extras além da categoria principal — máx 3 para não poluir
  const habilidades = (prestador.habilidades || []).slice(0, 3)

  return (
    <div className={`bg-white border p-5 md:p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all group ${
      isPublico ? 'border-slate-100' : 'border-blue-50'
    }`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">

        {/* ── Esquerda: foto + textos ── */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100 shadow-sm flex items-center justify-center">
            {prestador.foto_perfil ? (
              <img
                src={prestador.foto_perfil}
                className="w-full h-full object-cover"
                alt={prestador.nome}
              />
            ) : (
              <span className="text-sm font-black text-slate-400 tracking-tighter">
                {getIniciais(prestador.nome)}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-0">
            {/* Nome + badge público */}
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

            {/* Categoria principal */}
            <span className="text-blue-600 text-[10px] md:text-[11px] font-black uppercase tracking-widest">
              {prestador.categoria}
            </span>

            {/* Habilidades extras — mostradas quando há mais de uma especialidade */}
            {habilidades.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {habilidades.map(hab => (
                  <span
                    key={hab}
                    className="text-[9px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wide"
                  >
                    {hab}
                  </span>
                ))}
                {(prestador.habilidades?.length || 0) > 3 && (
                  <span className="text-[9px] font-semibold text-slate-400 px-1 py-0.5">
                    +{prestador.habilidades.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Localização com guard contra bairro null */}
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={10} className="shrink-0 text-slate-300" />
              <p className="text-[10px] md:text-[11px] font-medium text-slate-400 tracking-tight truncate">
                {localizacao}
              </p>
            </div>
          </div>
        </div>

        {/* ── Direita: ações ── */}
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-3 shrink-0">
          {/* "É você?" — texto completo, sem corte */}
          {isPublico && (
            <Link
              href={session
                ? `/reivindicar?id=${prestador.id}&nome=${encodeURIComponent(prestador.nome)}`
                : `/reivindicar?id=${prestador.id}&nome=${encodeURIComponent(prestador.nome)}`
              }
              className="text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors whitespace-nowrap"
            >
              É você? Reivindique
            </Link>
          )}

          <Link
            href={`/${prestador.slug || prestador.id}`}
            onClick={() => registrarLog?.('CLIQUE_PERFIL', { nome: prestador.nome })}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] hover:bg-blue-700 transition-all active:scale-95 text-center shadow-lg shadow-blue-100 whitespace-nowrap"
          >
            Ver Perfil
          </Link>
        </div>
      </div>
    </div>
  )
}