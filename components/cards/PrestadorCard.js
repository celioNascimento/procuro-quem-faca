'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PrestadorCard({ prestador, registrarLog }) {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })
  }, [])

  if (!prestador) return null;

  const isPublico = prestador.origem_tipo === 'curadoria_publica'

  const getIniciais = (nome) => {
    if (!nome) return '?';
    const partes = nome.trim().split(/\s+/);
    if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
    return partes[0][0].toUpperCase();
  };

  return (
    <div className={`bg-white border p-5 md:p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all relative group ${isPublico ? 'border-slate-100' : 'border-blue-50'}`}>
      {/* Container Principal: Coluna no mobile, Linha no desktop */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">

        {/* Lado Esquerdo: Foto e Textos */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100 shadow-sm flex items-center justify-center">
            {prestador.foto_perfil ? (
              <img
                src={prestador.foto_perfil}
                className="w-full h-full object-cover"
                alt={prestador.nome}
              />
            ) : (
              <span className="text-sm font-black text-slate-400 tracking-tighter">{getIniciais(prestador.nome)}</span>
            )}
          </div>

          <div className="flex flex-col items-start text-left gap-0.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 max-w-full">
              <h3 className="font-bold text-slate-900 text-base md:text-lg tracking-tight leading-tight truncate">{prestador.nome}</h3>
              {isPublico && (
                <span className="hidden sm:inline-block bg-slate-100 text-slate-500 text-[7px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tight shrink-0">Público</span>
              )}
            </div>

            <span className="text-blue-600 text-[10px] md:text-[11px] font-black uppercase tracking-widest">{prestador.categoria}</span>

            <div className="flex items-center gap-1 w-full mt-0.5 text-slate-400">
              <MapPin size={10} className="shrink-0 text-slate-300" />
              <p className="text-[10px] md:text-[11px] font-medium tracking-tight truncate">
                {prestador.bairro} <span className="opacity-30">•</span> {prestador.cidades?.nome || 'Londrina'}
              </p>
            </div>
          </div>
        </div>

        {/* Lado Direito: Ações */}
        <div className="flex flex-col items-stretch md:items-end gap-2 shrink-0">
          {isPublico && (
            <Link
              href={session ? `/cadastro?reivindicar=${prestador.id}` : `/reivindicar?id=${prestador.id}&nome=${encodeURIComponent(prestador.nome)}`}
              className="text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors text-center md:text-right px-2"
            >
              É você? Reivindique
            </Link>
          )}

          <Link
            href={`/${prestador.slug || prestador.id}`}
            onClick={() => registrarLog && registrarLog('CLIQUE_PERFIL', { nome: prestador.nome })}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] hover:bg-blue-700 transition-all active:scale-95 text-center shadow-lg shadow-blue-100 md:w-auto"
          >
            Ver Perfil
          </Link>
        </div>
      </div>
    </div>
  )
}

// Pequeno ajuste de ícone que faltava no escopo:
function MapPin({ size, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  )
}
