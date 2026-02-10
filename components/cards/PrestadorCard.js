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
    <div className={`bg-white border p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all relative group ${isPublico ? 'border-slate-100' : 'border-blue-50'}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

        <div className="flex items-center gap-4 flex-1">
          <div className="w-16 h-16 rounded-full bg-slate-50 overflow-hidden shrink-0 border border-slate-100 shadow-sm flex items-center justify-center">
            {prestador.foto_perfil ? (
              <img
                src={prestador.foto_perfil}
                className="w-full h-full object-cover"
                alt={prestador.nome}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<span class="text-sm font-black text-slate-400 tracking-tighter">${getIniciais(prestador.nome)}</span>`;
                }}
              />
            ) : (
              <span className="text-sm font-black text-slate-400 tracking-tighter">{getIniciais(prestador.nome)}</span>
            )}
          </div>

          <div className="flex flex-col items-start text-left gap-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-lg md:text-xl tracking-tight leading-none">{prestador.nome}</h3>
              {isPublico && (
                <span className="bg-slate-100 text-slate-500 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight">Info Pública</span>
              )}
            </div>

            <div className="flex flex-col">
              <span className="text-blue-600 text-[11px] font-semibold uppercase tracking-wider">{prestador.categoria}</span>
              {prestador.habilidades && prestador.habilidades.length > 0 && (
                <span className="text-[9px] text-slate-400 font-medium lowercase italic leading-tight mt-0.5">
                  #{Array.isArray(prestador.habilidades) ? prestador.habilidades.join(', ') : prestador.habilidades}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 w-full mt-1">
              <span className="text-slate-400 text-xs shrink-0">📍</span>
              <p className="text-slate-400 text-[11px] font-medium tracking-tight truncate">
                {prestador.bairro} <span className="mx-0.5 opacity-30">•</span> {prestador.cidades?.nome || 'Londrina - PR'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end gap-3 shrink-0">
          {isPublico && (
            <Link
              // CIRÚRGICO: Se logado, vai direto para o cadastro com o ID de reivindicação
              href={session ? `/cadastro?reivindicar=${prestador.id}` : `/reivindicar?id=${prestador.id}&nome=${encodeURIComponent(prestador.nome)}`}
              className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide hover:text-indigo-600 transition-colors"
            >
              Este é você? Solicite aqui
            </Link>
          )}

          <Link
            href={`/perfil/${prestador.slug || prestador.id}`}
            onClick={() => registrarLog && registrarLog('CLIQUE_PERFIL', { nome: prestador.nome })}
            className="w-full md:w-auto bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold text-[11px] uppercase tracking-wider hover:bg-blue-700 transition-all active:scale-95 text-center"
          >
            Ver Perfil
          </Link>
        </div>
      </div>
    </div>
  )
}