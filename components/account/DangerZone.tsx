import Link from 'next/link'
import { ShieldAlert, ArrowRight } from 'lucide-react'

type DangerZoneProps = {
  audience: 'cliente' | 'prestador'
}

const content = {
  cliente: {
    label: 'Conta do cliente',
    title: 'Excluir minha conta',
    description: 'Essa ação remove seus dados de acesso e informações do painel. Projetos já concluídos podem permanecer anonimizados para preservar o histórico da plataforma.',
  },
  prestador: {
    label: 'Conta profissional',
    title: 'Excluir meu perfil e conta',
    description: 'Essa ação remove seu perfil profissional, fotos e dados de acesso. A exclusão é permanente e não poderá ser desfeita.',
  },
} as const

export function DangerZone({ audience }: DangerZoneProps) {
  const item = content[audience]

  return (
    <section
      className="flex flex-col gap-4 rounded-[1.75rem] border border-red-200 bg-red-50/70 p-5 sm:p-6"
      aria-labelledby={`danger-zone-${audience}-title`}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
          <ShieldAlert className="size-5" aria-hidden="true" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600">{item.label}</p>
          <h2 id={`danger-zone-${audience}-title`} className="text-base font-black text-red-950">{item.title}</h2>
          <p className="text-[13px] leading-6 text-red-900/80">{item.description}</p>
        </div>
      </div>
      <Link
        href="/confirmar-exclusao"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-700 transition-colors hover:bg-red-600 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200"
      >
        Continuar para exclusão
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </section>
  )
}

export default DangerZone
