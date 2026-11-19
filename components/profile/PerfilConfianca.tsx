// components/profile/PerfilConfianca.tsx
//
// Bloco de confiança no topo do perfil. A prova social é a quantidade de INDICAÇÕES de
// clientes (não nota média). Só mostra o que existe: sem indicação, sem serviço concluído
// ou sem garantia, o item simplesmente não aparece (nunca "0").
import { ThumbsUp, ThumbsDown, CheckCircle2, ShieldCheck, MapPin, BadgeCheck, Award, CalendarClock, Briefcase } from 'lucide-react'
import type { PrestadorPerfil } from '@/types/perfil'
import {
  rotuloNivel,
  textoSeloCnpj,
  TEXTO_ATIVIDADE,
  TEXTO_EXPERIENCIA,
  type SeloCnpjPublico,
  type SelosComplementares,
} from '@/lib/selos/publico'
import { textoSeloPublico } from '@/lib/selos/documentos'
import { textoTempoCnpj } from '@/lib/selos/tempoCnpj'
import { apresentarNivel } from '@/lib/selos/nivel'
import { textoTagNaoIndicam } from '@/lib/avaliacoes/transparencia'

interface Props {
  prestador: PrestadorPerfil
  totalIndicacoes: number
  /** Não indicações; mostradas sempre ao lado das indicações. */
  totalNaoIndicacoes?: number
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

export default function PerfilConfianca({ prestador, totalIndicacoes, totalNaoIndicacoes = 0, totalConcluidos, selo = null, nivel = null, complementares = null }: Props) {
  const garantiaDias = prestador.garantia_dias ?? 0
  const cidades = (prestador.cidades_atendidas ?? []).filter(c => c?.trim())
  const atende = cidades.length > 0
    ? cidades.join(', ')
    : prestador.cidades?.nome ?? ''

  const temDestaque = totalIndicacoes > 0
  const temNaoIndicacoes = totalNaoIndicacoes > 0
  const tagNaoIndicam = textoTagNaoIndicam(totalIndicacoes, totalNaoIndicacoes)
  const nomeNivel = rotuloNivel(nivel)
  const itens = [
    selo && {
      key: 'selo-cnpj',
      icon: <BadgeCheck size={14} className="text-green-600" aria-hidden="true" />,
      texto: <span data-testid="selo-cnpj-texto">{textoSeloCnpj(selo)}</span>,
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
    complementares?.seguro && {
      key: 'selo-seguro',
      icon: <ShieldCheck size={14} className="text-green-600" aria-hidden="true" />,
      texto: <span data-testid="selo-seguro-texto">{textoSeloPublico('seguro')}</span>,
    },
    complementares?.cnd && {
      key: 'selo-cnd',
      icon: <BadgeCheck size={14} className="text-green-600" aria-hidden="true" />,
      texto: <span data-testid="selo-cnd-texto">{textoSeloPublico('cnd')}</span>,
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
  ].filter(Boolean) as { key: string; icon: React.ReactNode; texto: React.ReactNode }[]

  if (!temDestaque && !temNaoIndicacoes && itens.length === 0) return null

  return (
    <section
      className={`rounded-[2rem] bg-white p-5 shadow-sm ${apresentarNivel(nivel).chave ? `border-2 ${apresentarNivel(nivel).borda}` : 'border border-slate-100'}`}
      data-testid="caixa-confianca"
      aria-label="Confiança neste profissional"
    >
      {((selo && nomeNivel) || tagNaoIndicam) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {selo && nomeNivel && (
            <span
              data-testid="nivel-perfil"
              className={`inline-flex items-center rounded-full border px-2 py-px text-xs font-black ${apresentarNivel(nivel).classes}`}
            >
              Nível {nomeNivel}
            </span>
          )}
          {tagNaoIndicam && (
            <span
              data-testid="tag-nao-indicam"
              className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-px text-xs font-black text-amber-900"
            >
              {tagNaoIndicam}
            </span>
          )}
        </div>
      )}

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

      {temNaoIndicacoes && (
        <p
          data-testid="placar-nao-indicam"
          className={`flex items-center gap-2 text-[13px] font-semibold text-slate-600 lg:text-sm ${temDestaque ? 'mt-3' : ''}`}
        >
          <ThumbsDown size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
          {totalNaoIndicacoes} {plural(totalNaoIndicacoes, 'cliente não indica', 'clientes não indicam')} este profissional
        </p>
      )}

      {itens.length > 0 && (
        <ul className={`flex flex-col gap-2.5 ${temDestaque || temNaoIndicacoes ? 'mt-4 border-t border-slate-50 pt-4' : ''}`}>
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
