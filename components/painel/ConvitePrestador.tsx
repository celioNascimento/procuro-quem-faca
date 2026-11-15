// components/painel/ConvitePrestador.tsx

'use client'
import Link from 'next/link'
import { ArrowRight, Briefcase, CheckCircle2, Clock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

// Botão da área do cliente que leva a pessoa à área do prestador:
// - sem cadastro profissional: convida a se tornar prestador (/cadastro)
// - cadastro em andamento: mostra como concluir (/cadastro)
// - cadastro completo: leva ao painel profissional (/dashboard)
export function ConvitePrestador() {
  const { session, role, prestadorStatus, roleLoading } = useAuth()

  // Espera saber o papel da conta para não mostrar o convite errado por um instante.
  if (session === undefined || !session || roleLoading) return null

  const temCadastro = role === 'prestador'
  const cadastroEmAndamento = temCadastro && prestadorStatus === 'pendente'

  if (temCadastro && !cadastroEmAndamento) {
    return (
      <section aria-labelledby="convite-prestador-titulo" className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <CheckCircle2 size={22} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 id="convite-prestador-titulo" className="text-base font-bold text-slate-900">Você também tem um perfil profissional</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-600">Gerencie seus trabalhos, fotos e atendimentos no painel profissional.</p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-[14px] font-semibold text-white shadow-md shadow-blue-100 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
        >
          Acessar painel profissional
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>
    )
  }

  if (cadastroEmAndamento) {
    return (
      <section aria-labelledby="convite-prestador-titulo" className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700">
            <Clock size={22} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 id="convite-prestador-titulo" className="text-base font-bold text-slate-900">Seu cadastro profissional está em andamento</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-700">Falta pouco para seu perfil aparecer para quem procura um serviço.</p>
          </div>
        </div>
        <Link
          href="/cadastro"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-[14px] font-semibold text-white shadow-md shadow-blue-100 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
        >
          Concluir cadastro
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>
    )
  }

  return (
    <section aria-labelledby="convite-prestador-titulo" className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Briefcase size={22} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 id="convite-prestador-titulo" className="text-base font-bold text-slate-900">Quer oferecer seus serviços no PQF?</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-600">O cadastro é gratuito. Você mostra seus trabalhos e recebe contatos de quem precisa.</p>
        </div>
      </div>
      <Link
        href="/cadastro"
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-[14px] font-semibold text-white shadow-md shadow-blue-100 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
      >
        Quero ser prestador
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </section>
  )
}

export default ConvitePrestador
