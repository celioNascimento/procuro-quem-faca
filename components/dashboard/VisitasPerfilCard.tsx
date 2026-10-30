// components/dashboard/VisitasPerfilCard.tsx
//
// Card do dashboard do prestador: quantas pessoas visitaram o perfil público
// dele. É o incentivo da Fase 1: mostrar que o perfil está sendo visto.
//
// A variação em relação ao período anterior aparece só quando é positiva (ver
// lib/utils/variacaoVisitas.ts). A altura da área de conteúdo é reservada para o
// card não pular quando os números chegam.

'use client'

import { Eye, TrendingDown, TrendingUp } from 'lucide-react'
import { useMinhasVisitas } from '@/hooks/useMinhasVisitas'
import {
  MOSTRAR_VARIACAO_NEGATIVA,
  variacaoParaExibir,
  type VariacaoVisitas,
} from '@/lib/utils/variacaoVisitas'

export function VisitasPerfilCard() {
  const { dados, carregando, erro } = useMinhasVisitas()

  // Sem perfil de prestador vinculado ao usuário: não há o que mostrar.
  if (!carregando && !erro && !dados) return null

  const opcoes = { mostrarNegativa: MOSTRAR_VARIACAO_NEGATIVA }

  return (
    <section
      className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5"
      aria-labelledby="visitas-perfil-titulo"
    >
      <div className="flex items-center gap-2">
        <Eye className="size-4 text-blue-600" aria-hidden="true" />
        <h2 id="visitas-perfil-titulo" className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
          Visitas ao seu perfil
        </h2>
      </div>

      <div className="mt-4 min-h-[92px]">
        {carregando ? (
          <div className="grid grid-cols-3 gap-3" role="status" aria-label="Carregando visitas">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[92px] animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : erro || !dados ? (
          <p className="text-xs leading-5 text-slate-400">
            Não foi possível carregar as visitas agora. Tente novamente em instantes.
          </p>
        ) : dados.visitasTotal === 0 ? (
          <p className="text-xs leading-5 text-slate-500">
            Seu perfil ainda não teve visitas. Compartilhe o link dele com clientes e conhecidos
            para começar a aparecer aqui.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <Numero
              valor={dados.visitas7d}
              rotulo="Últimos 7 dias"
              variacao={variacaoParaExibir(dados.visitas7d, dados.visitas7dAnterior, opcoes)}
              periodo="7 dias"
            />
            <Numero
              valor={dados.visitas30d}
              rotulo="Últimos 30 dias"
              variacao={variacaoParaExibir(dados.visitas30d, dados.visitas30dAnterior, opcoes)}
              periodo="30 dias"
            />
            <Numero valor={dados.visitasTotal} rotulo="Total registrado" />
          </div>
        )}
      </div>

      {!carregando && !erro && dados && dados.visitasTotal > 0 && (
        <p className="mt-3 text-[11px] leading-4 text-slate-400">
          Cada pessoa conta uma vez a cada 24 horas. Desde 29/10, suas próprias visitas e as de
          robôs não entram; os números anteriores podem incluí-las.
        </p>
      )}
    </section>
  )
}

function Numero({
  valor,
  rotulo,
  variacao = null,
  periodo,
}: {
  valor: number
  rotulo: string
  variacao?: VariacaoVisitas | null
  periodo?: string
}) {
  return (
    <div className="min-h-[92px] rounded-xl bg-slate-50 px-3 py-3">
      <p className="text-2xl font-black leading-none text-slate-900 tabular-nums">{valor}</p>
      <p className="mt-1.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">{rotulo}</p>
      {/* Linha sempre reservada, para os três quadros terem a mesma altura. */}
      <p className="mt-1 h-4 text-[11px] font-bold leading-4">
        {variacao && <Variacao variacao={variacao} periodo={periodo} />}
      </p>
    </div>
  )
}

function Variacao({ variacao, periodo }: { variacao: VariacaoVisitas; periodo?: string }) {
  const alta = variacao.sentido === 'alta'
  const Icone = alta ? TrendingUp : TrendingDown
  const modulo = Math.abs(variacao.percentual)

  return (
    <span className={`inline-flex items-center gap-1 ${alta ? 'text-emerald-600' : 'text-slate-500'}`}>
      <Icone className="size-3" aria-hidden="true" />
      <span aria-hidden="true">{alta ? '+' : '−'}{modulo}%</span>
      <span className="sr-only">
        {alta ? 'Alta' : 'Queda'} de {modulo}% em relação aos {periodo ?? 'dias'} anteriores
      </span>
    </span>
  )
}