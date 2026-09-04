// app/(dashboard)/dashboard/page.tsx

'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import EditarPerfilTab from '@/components/dashboard/EditarPerfilTab'
import PortfolioDashboardTab from '@/components/dashboard/PortfolioDashboardTab'
import AvaliacoesDashboardTab from '@/components/dashboard/AvaliacoesDashboardTab'
import { AdCardDashboard } from '@/components/dashboard/AdCardDashboard'
import { Lock, UserCircle2, Images, Loader2, ShieldAlert, MessageCircle, Send, Star } from 'lucide-react'
import { NUMERO_WHATSAPP_PQF } from '@/lib/config/contato'
import { usePerfilStatus } from '@/hooks/usePerfilStatus'

function PerfilPageContent() {
  const searchParams = useSearchParams()
  const abaInicial = searchParams.get('aba') === 'perfil' ? 'perfil' : 'portfolio'
  const [abaAtiva, setAbaAtiva] = useState(abaInicial)
  const [mensagemSuporte, setMensagemSuporte] = useState('')
  const { cadastroCompleto, validando, slug, prestadorId, bloqueado, motivoBloqueio } = usePerfilStatus()
  const linkSuporte = `https://wa.me/${NUMERO_WHATSAPP_PQF}?text=${encodeURIComponent(`Olá, equipe Procuro Quem Faça. Meu perfil ${slug ? `(${slug}) ` : ''}foi bloqueado e gostaria de solicitar esclarecimentos.\n\n${mensagemSuporte.trim()}`)}`

  useEffect(() => {
    if (!validando && !cadastroCompleto) setAbaAtiva('perfil')
  }, [validando, cadastroCompleto])

  const abas = [
    {
      id: 'portfolio',
      label: 'Meus Projetos',
      icon: <Images size={14} />,
      bloqueado: !cadastroCompleto,
      externo: false,
    },
    {
      id: 'avaliacoes',
      label: 'Avaliações',
      icon: <Star size={14} />,
      bloqueado: !cadastroCompleto,
      externo: false,
    },
    {
      id: 'perfil',
      label: 'Dados Profissionais',
      icon: <UserCircle2 size={14} />,
      bloqueado: false,
      externo: false,
    },
  ]

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8 sm:pb-8">
        <div className="flex max-w-2xl flex-col gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">Área profissional</p>
          <h1 className="text-balance text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Gerencie sua presença profissional</h1>
        </div>
      </header>

      {bloqueado && (
        <section className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-950" role="alert" aria-labelledby="perfil-bloqueado-titulo">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden="true" />
          <div className="min-w-0 space-y-1">
            <h2 id="perfil-bloqueado-titulo" className="text-sm font-black uppercase tracking-wide text-red-700">Seu perfil está bloqueado</h2>
            <p className="text-sm leading-6 text-red-900">Seu perfil foi temporariamente retirado da busca e os clientes não conseguem iniciar contato por ele.</p>
            {motivoBloqueio && <p className="text-sm leading-6 text-red-800"><strong>Motivo informado pela moderação:</strong> {motivoBloqueio}</p>}
            <p className="pt-1 text-xs leading-5 text-red-800">Revise o motivo acima e entre em contato com a equipe de suporte caso precise de esclarecimentos.</p>
            <div className="mt-4 rounded-2xl border border-red-200 bg-white/75 p-3">
              <label htmlFor="mensagem-suporte" className="mb-2 block text-xs font-bold text-red-900">Fale com a equipe sobre este bloqueio</label>
              <textarea
                id="mensagem-suporte"
                value={mensagemSuporte}
                onChange={(event) => setMensagemSuporte(event.target.value)}
                placeholder="Escreva sua dúvida ou contestação..."
                rows={3}
                className="w-full resize-none rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-red-200"
              />
              <a
                href={linkSuporte}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-xs font-black uppercase tracking-wide text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                <span>Enviar mensagem ao suporte</span>
                <Send className="size-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>
      )}

      <div className="pt-6">
        <AdCardDashboard />
      </div>

      <nav className="sticky top-16 z-40 -mx-4 border-b border-slate-200 bg-[#F8FAFC]/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 md:top-28 lg:-mx-8 lg:px-8" aria-label="Seções do dashboard">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {abas.map(aba => {
            const ativa = abaAtiva === aba.id
            return (
              <button
                key={aba.id}
                type="button"
                disabled={aba.bloqueado || validando}
                onClick={() => setAbaAtiva(aba.id)}
                aria-current={ativa ? 'page' : undefined}
                aria-describedby={aba.bloqueado ? `${aba.id}-locked` : undefined}
                className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${ativa
                  ? 'bg-blue-600 text-white shadow-sm'
                  : aba.bloqueado
                    ? 'cursor-not-allowed bg-slate-100 text-slate-300'
                    : 'bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-600'
                  }`}
              >
                {aba.bloqueado && !validando ? <Lock size={13} aria-hidden="true" /> : aba.icon}
                {aba.label}
                {aba.bloqueado && !validando && (
                  <span id={`${aba.id}-locked`} className="rounded-md bg-white/70 px-1.5 py-0.5 text-[8px] tracking-wide text-slate-400">
                    Complete o perfil
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      <div className="animate-in fade-in duration-300 pt-6 sm:pt-8">
        {validando ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4" role="status">
            <Loader2 className="size-8 animate-spin text-blue-600" aria-hidden="true" />
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Verificando seu perfil</p>
          </div>
        ) : (
          abaAtiva === 'perfil' ? <EditarPerfilTab /> : abaAtiva === 'avaliacoes' ? <AvaliacoesDashboardTab prestadorId={prestadorId} /> : <PortfolioDashboardTab />
        )}
      </div>
    </div>
  )
}

export default function PerfilPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-64 items-center justify-center" role="status" aria-label="Carregando dashboard">
        <Loader2 className="size-8 animate-spin text-blue-600" aria-hidden="true" />
      </div>
    }>
      <PerfilPageContent />
    </Suspense>
  )
}
