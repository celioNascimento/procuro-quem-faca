// components/profile/PerfilConfianca.tsx
//
// Bloco de confiança no topo do perfil. A prova social é a quantidade de INDICAÇÕES de
// clientes (não nota média). Só mostra o que existe: sem indicação, sem serviço concluído
// ou sem garantia, o item simplesmente não aparece (nunca "0").
import { ThumbsUp, CheckCircle2, ShieldCheck, MapPin, BadgeCheck, Award, CalendarClock, Briefcase } from 'lucide-react'
import type { PrestadorPerfil } from '@/types/perfil'
import {
  rotuloNivel,
  textoSeloCnpj,
  TEXTO_ATIVIDADE,
  TEXTO_EXPERIENCIA,
  type SeloCnpjPublico,
  type SelosComplementares,
} from '@/lib/selos/publico'
import { textoTempoCnpj } from '@/lib/selos/tempoCnpj'

interface Props {
  prestador: PrestadorPerfil
  totalIndicacoes: number
  totalConcluidos: number
  /** Selo de CNPJ vigente e nível calculado pelo banco; ausentes = não aparece nada. */
  selo?: SeloCnpjPublico | null
  nivel?: string | null
  /** Experiência no PQF, tempo de CNPJ e atividade compatível; ausentes = não aparece nada. */
  complementares?: SelosComplementares | null
}

function plural(n: number, singular: string, pluralForm: string) {
  return n === 1 ? singular : pluralForm
}

export default function PerfilConfianca({ prestador, totalIndicacoes, totalConcluidos, selo = null, nivel = null, complementares = null }: Props) {
  const garantiaDias = prestador.garantia_dias ?? 0
  const cidades = (prestador.cidades_atendidas ?? []).filter(c => c?.trim())
  const atende = cidades.length > 0
    ? cidades.join(', ')
    : prestador.cidades?.nome ?? ''

  const temDestaque = totalIndicacoes > 0
  const nomeNivel = rotuloNivel(nivel)
  const itens = [
    selo && {
      key: 'selo-cnpj',
      icon: <BadgeCheck size={14} className="text-green-600" aria-hidden="true" />,
      texto: nomeNivel ? `Nível ${nomeNivel} · ${textoSeloCnpj(selo)}` : textoSeloCnpj(selo),
    },
    complementares?.experiencia && {
      key: 'selo-experiencia',
      icon: <Award size={14} className="text-green-600" aria-hidden="true" />,
      texto: TEXTO_EXPERIENCIA,
    },
    complementares?.tempoCnpj && {
      key: 'selo-tempo-cnpj',
      icon: <CalendarClock size={14} className="text-green-600" aria-hidden="true" />,
      texto: textoTempoCnpj(complementares.tempoCnpj),
    },
    complementares?.atividadeCompativel && {
      key: 'selo-atividade',
      icon: <Briefcase size={14} className="text-green-600" aria-hidden="true" />,
      texto: TEXTO_ATIVIDADE,
    },
    totalConcluidos > 0 && {
      key: 'concluidos',
      icon: <CheckCircle2 size={14} className="text-green-500" aria-hidden="true" />,
      texto: `${totalConcluidos} ${plural(totalConcluidos, 'serviço concluído', 'serviços concluídos')}`,
    },
    garantiaDias > 0 && {
      key: 'garantia',
      icon: <ShieldCheck size={14} className="text-blue-600" aria-hidden="true" />,
      texto: `${garantiaDias} dias de garantia pós-serviço`,
    },
    atende && {
      key: 'atende',
      icon: <MapPin size={14} className="text-slate-400" aria-hidden="true" />,
      texto: `Atende em ${atende}`,
    },
  ].filter(Boolean) as { key: string; icon: React.ReactNode; texto: string }[]

  if (!temDestaque && itens.length === 0) return null

  return (
    <section
      className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm"
      aria-label="Confiança neste profissional"
    >
      {temDestaque && (
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <ThumbsUp size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-2xl font-black leading-none text-slate-800 tabular-nums lg:text-3xl">
              {totalIndicacoes}{' '}
              <span className="text-base font-bold text-slate-700 lg:text-lg">
                {plural(totalIndicacoes, 'indicação', 'indicações')}
              </span>
            </p>
            <p className="mt-1 text-xs font-medium leading-snug text-slate-500 lg:text-sm [@media(min-width:1024px)_and_(max-height:860px)]:hidden">
              {plural(totalIndicacoes, 'Cliente indicou', 'Clientes indicaram')} este profissional depois do serviço.
            </p>
          </div>
        </div>
      )}

      {itens.length > 0 && (
        <ul className={`flex flex-col gap-2.5 ${temDestaque ? 'mt-4 border-t border-slate-50 pt-4' : ''}`}>
          {itens.map(item => (
            <li key={item.key} className="flex items-start gap-2.5 text-[13px] font-semibold leading-snug text-slate-600 lg:text-sm">
              <span className="mt-0.5 shrink-0">{item.icon}</span>
              <span className="min-w-0">{item.texto}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
