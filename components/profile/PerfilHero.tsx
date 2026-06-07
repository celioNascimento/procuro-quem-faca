import Link from 'next/link'
import { MapPin, ShieldCheck, Flag, Share2, CheckCircle, Wrench, Star } from 'lucide-react'
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

  const totalFinalizados = projetos.filter(p => p.status === 'finalizado').length
  const totalEmAndamento = projetos.filter(p => p.status === 'em_execucao').length
  const slug             = prestador.slug

  return (
    <section className="flex flex-col gap-3">

      {/* ── Card: foto + identidade ── */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        {/* Foto */}
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

          {/* Badge verificado sobre a foto */}
          {prestador.verificado && (
            <div className="absolute bottom-3 right-3 bg-blue-600 text-white p-1.5 rounded-full shadow-lg border-2 border-white">
              <ShieldCheck size={14} strokeWidth={3} />
            </div>
          )}
        </div>

        {/* Nome + slug + localização */}
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

      {/* ── Card: dados profissionais ── */}
      {(prestador.categorias?.nome || prestador.categoria || localizacao ||
        (totalFinalizados > 0) || (totalEmAndamento > 0)) && (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm divide-y divide-slate-100">

          {/* Categoria */}
          {(prestador.categorias?.nome || prestador.categoria) && (
            <div className="flex gap-3 items-start px-4 py-3">
              <Wrench size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                  Especialidade
                </p>
                <p className="text-[12px] font-bold text-slate-700 truncate">
                  {prestador.categorias?.nome || prestador.categoria}
                </p>
              </div>
            </div>
          )}

          {/* Projetos concluídos / em andamento */}
          {(totalFinalizados > 0 || totalEmAndamento > 0) && (
            <div className="flex gap-3 items-start px-4 py-3">
              <Star size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Atividade
                </p>
                <div className="flex flex-wrap gap-2">
                  {totalFinalizados > 0 && (
                    <span className="px-2.5 py-1 bg-green-50 border border-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      ✓ {totalFinalizados} {totalFinalizados === 1 ? 'concluído' : 'concluídos'}
                    </span>
                  )}
                  {totalEmAndamento > 0 && (
                    <span className="px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      ● {totalEmAndamento} em andamento
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
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