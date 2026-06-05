import Link from 'next/link'
import { MapPin, ShieldCheck, Flag, Share2, CheckCircle } from 'lucide-react'
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

  return (
    <section className="relative mb-6 flex flex-col items-center lg:items-start text-center lg:text-left gap-4 lg:gap-5">
      
      <div className="relative">
        <div className="w-28 h-28 lg:w-36 lg:h-36 rounded-[2rem] bg-slate-100 overflow-hidden border-4 border-white shadow-xl transition-all">
          {prestador.foto_perfil
            ? <img src={prestador.foto_perfil} className="w-full h-full object-cover" alt={prestador.nome} />
            : <span className="w-full h-full flex items-center justify-center text-slate-300 font-black text-[9px] uppercase tracking-widest">Sem Foto</span>
          }
        </div>
        {prestador.verificado && (
          <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full shadow-lg border-2 border-white">
            <ShieldCheck size={14} strokeWidth={3} className="lg:w-5 lg:h-5" />
          </div>
        )}
      </div>

      <div className="w-full">
        <h1 className="text-2xl lg:text-3xl font-black text-slate-800 uppercase italic tracking-tight leading-none">
          {prestador.nome}
        </h1>
        {(prestador.categorias?.nome || prestador.categoria) && (
          <p className="text-blue-600 text-[10px] lg:text-xs font-black uppercase tracking-widest mt-1 lg:mt-2">
            {prestador.categorias?.nome || prestador.categoria}
          </p>
        )}
        {localizacao && (
          <p className="flex items-center justify-center lg:justify-start gap-1 text-[11px] lg:text-xs font-medium text-slate-400 mt-1.5 lg:mt-2">
            <MapPin size={12} /> {localizacao}
          </p>
        )}
      </div>

      {(totalFinalizados > 0 || totalEmAndamento > 0) && (
        <div className="flex items-center gap-2 flex-wrap justify-center lg:justify-start mt-1">
          {totalFinalizados > 0 && (
            <span className="px-3 py-1.5 bg-green-50 border border-green-100 text-green-700 rounded-full text-[10px] lg:text-[11px] font-bold uppercase tracking-wider">
              ✓ {totalFinalizados} {totalFinalizados === 1 ? 'concluído' : 'concluídos'}
            </span>
          )}
          {totalEmAndamento > 0 && (
            <span className="px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-full text-[10px] lg:text-[11px] font-bold uppercase tracking-wider">
              ● {totalEmAndamento} em andamento
            </span>
          )}
        </div>
      )}

      {/* Ações Secundárias movidas para a base do bloco */}
      <div className="flex items-center justify-center lg:justify-start gap-3 w-full mt-2 lg:mt-4 pt-4 border-t border-slate-100">
        <Link
          href={`/denunciar/${prestador.id}`}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-100 rounded-full text-[10px] font-semibold text-slate-400 shadow-sm hover:text-red-500 hover:border-red-100 transition-all active:scale-95"
        >
          <Flag size={12} />
          Denunciar
        </Link>

        <button
          onClick={onCompartilhar}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-100 rounded-full text-[10px] font-semibold text-slate-400 shadow-sm hover:text-blue-600 hover:border-blue-100 transition-all active:scale-95"
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