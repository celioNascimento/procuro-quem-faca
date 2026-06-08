import Link from 'next/link'
import { MapPin, ShieldCheck, Flag, Share2, CheckCircle, Star } from 'lucide-react'
import type { PrestadorPerfil, ProjetoPerfil } from '@/types/perfil'

interface Props {
  prestador: PrestadorPerfil
  projetos: ProjetoPerfil[]
  compartilhando: boolean
  onCompartilhar: () => void
}

export default function PerfilHero({ prestador, projetos, compartilhando, onCompartilhar }: Props) {
  const localizacao = [prestador.bairro, prestador.cidades?.nome]
    .filter(v => v?.trim())
    .join(', ')

  const totalFinalizados  = projetos.filter(p => p.status === 'finalizado').length
  const totalEmAndamento  = projetos.filter(p => p.status === 'em_execucao').length
  const totalProjetos     = projetos.length
  const slug              = prestador.slug
  const categoria         = prestador.categorias?.nome || prestador.categoria

  return (
    <section className="flex flex-col gap-3">

      {/* ── Card: foto + identidade ── */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="aspect-square bg-slate-50 flex items-center justify-center relative">
          {prestador.foto_perfil ? (
            <img
              src={prestador.foto_perfil}
              className="w-full h-full object-cover"
              alt={prestador.nome}
            />
          ) : (
            <span className="text-slate-300 font-black text-[9px] uppercase tracking-widest">
              Sem Foto
            </span>
          )}

          {prestador.verificado && (
            <div className="absolute bottom-3 right-3 bg-blue-600 text-white p-1.5 rounded-full shadow-lg border-2 border-white">
              <ShieldCheck size={14} strokeWidth={3} />
            </div>
          )}
        </div>

        <div className="px-4 py-4 border-t border-slate-100">
          <h1 className="font-black text-[17px] text-slate-800 leading-tight tracking-tight uppercase italic">
            {prestador.nome}
          </h1>
          {slug && (
            <p className="text-[11px] text-blue-400 font-bold truncate mt-1 tracking-wide">
              @{slug}
            </p>
          )}
          {localizacao && (
            <p className="flex items-center gap-1 text-[11px] font-medium text-slate-400 mt-2">
              <MapPin size={12} className="shrink-0" />
              {localizacao}
            </p>
          )}
        </div>
      </div>

      {/* ── Card: portfólio — estilo DashboardHeader ── */}
      {(totalProjetos > 0 || categoria) && (
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[2rem] p-6 text-white relative overflow-hidden">
          {/* Decoração geométrica */}
          <div className="absolute -top-5 -right-5 w-28 h-28 bg-white/5 rounded-full" />
          <div className="absolute -bottom-8 -left-3 w-36 h-36 bg-white/[0.04] rounded-full" />

          <div className="relative z-10 flex flex-col gap-3.5">
            {/* Título */}
            <div>
              <p className="text-blue-200 text-[9px] font-black uppercase tracking-[0.3em] mb-1">
                Portfólio
              </p>
              <h2 className="text-2xl font-black uppercase italic tracking-tight leading-none">
                {totalProjetos === 0
                  ? 'Sem Registros'
                  : `${totalProjetos} ${totalProjetos === 1 ? 'Projeto' : 'Projetos'}`}
              </h2>

              {(totalFinalizados > 0 || totalEmAndamento > 0) && (
                <div className="flex items-center gap-4 mt-2.5 flex-wrap">
                  {totalFinalizados > 0 && (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-300 shrink-0" />
                      {totalFinalizados} concluído{totalFinalizados > 1 ? 's' : ''}
                    </span>
                  )}
                  {totalEmAndamento > 0 && (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse shrink-0" />
                      {totalEmAndamento} em andamento
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Divisor + rodapé com avaliação e categoria */}
            {categoria && (
              <>
                <div className="w-full h-px bg-white/10" />
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-100">
                    <Star size={11} className="text-yellow-300 fill-yellow-300 shrink-0" />
                    {prestador.categorias?.nome || prestador.categoria}
                  </span>
                  {prestador.verificado && (
                    <span className="bg-white/10 border border-white/15 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em]">
                      Verificado
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Ações secundárias ── */}
      <div className="flex items-center gap-2">
        <Link
          href={`/denunciar/${prestador.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-slate-100 rounded-[1.5rem] text-[10px] font-bold text-slate-400 shadow-sm hover:text-red-500 hover:border-red-100 transition-all active:scale-95"
        >
          <Flag size={12} />
          Denunciar
        </Link>

        <button
          onClick={onCompartilhar}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-slate-100 rounded-[1.5rem] text-[10px] font-bold text-slate-400 shadow-sm hover:text-blue-600 hover:border-blue-100 transition-all active:scale-95"
        >
          {compartilhando
            ? <><CheckCircle size={12} className="text-green-500" /> Copiado!</>
            : <><Share2 size={12} /> Compartilhar</>
          }
        </button>
      </div>

    </section>
  )
}