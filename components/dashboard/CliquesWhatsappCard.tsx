// components/dashboard/CliquesWhatsappCard.tsx
//
// Card do dashboard do prestador: quantas pessoas clicaram em "Solicitar
// Orçamento" no perfil público. Não mostra "0" quando a contagem ainda não
// está ativa para o perfil (teste por amostra).

'use client'

import { MessageCircle } from 'lucide-react'
import { useMeusCliques } from '@/hooks/useMeusCliques'

export function CliquesWhatsappCard() {
  const { dados, carregando, erro } = useMeusCliques()

  return (
    <section
      className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5"
      aria-labelledby="cliques-whatsapp-titulo"
    >
      <div className="flex items-center gap-2">
        <MessageCircle className="size-4 text-emerald-600" aria-hidden="true" />
        <h2 id="cliques-whatsapp-titulo" className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
          Pedidos de orçamento pelo WhatsApp
        </h2>
      </div>

      {carregando ? (
        <div className="mt-4 grid grid-cols-3 gap-3" role="status" aria-label="Carregando cliques">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : erro || !dados ? (
        <p className="mt-3 text-xs leading-5 text-slate-400">
          Não foi possível carregar os cliques agora. Tente novamente em instantes.
        </p>
      ) : !dados.rastreando ? (
        <p className="mt-3 text-xs leading-5 text-slate-500">
          A contagem de cliques ainda não está ativa para o seu perfil. Ela está sendo liberada
          aos poucos para todos os profissionais.
        </p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Numero valor={dados.ultimos7} rotulo="Últimos 7 dias" />
            <Numero valor={dados.ultimos30} rotulo="Últimos 30 dias" />
            <Numero valor={dados.total} rotulo="Total registrado" />
          </div>
          <p className="mt-3 text-[11px] leading-4 text-slate-400">
            Cada pessoa conta uma vez a cada 24 horas no mesmo perfil, mesmo que clique várias
            vezes. Seus próprios cliques não entram.
          </p>
        </>
      )}
    </section>
  )
}

function Numero({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-3">
      <p className="text-2xl font-black leading-none text-slate-900 tabular-nums">{valor}</p>
      <p className="mt-1.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">{rotulo}</p>
    </div>
  )
}
