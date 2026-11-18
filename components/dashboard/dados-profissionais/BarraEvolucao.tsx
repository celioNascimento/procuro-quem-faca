// components/dashboard/dados-profissionais/BarraEvolucao.tsx
// Só mostra a evolução das conquistas (selos). Não busca dados e não muda a ordem na busca.
import { BadgeCheck, Clock, Sparkles } from 'lucide-react'
import { apresentarNivel } from '@/lib/selos/nivel'
import { resumoEvolucao, type Conquista, type EstadoConquista } from '@/lib/selos/evolucao'

const ROTULO: Record<EstadoConquista, string> = {
  conquistado: 'Conquistado',
  em_andamento: 'Em conferência',
  em_progresso: 'Em andamento',
  disponivel: 'Disponível',
  depende_cnpj: 'Depende do CNPJ',
  nao_aplica: 'Não se aplica',
  nao_sabemos: 'Ainda não sabemos',
  em_breve: 'Em breve',
}

const ESTILO: Record<EstadoConquista, string> = {
  conquistado: 'bg-green-50 text-green-700',
  em_andamento: 'bg-amber-50 text-amber-700',
  em_progresso: 'bg-amber-50 text-amber-700',
  disponivel: 'bg-blue-50 text-blue-700',
  depende_cnpj: 'bg-slate-100 text-slate-600',
  nao_aplica: 'bg-slate-100 text-slate-500',
  nao_sabemos: 'bg-slate-100 text-slate-600',
  em_breve: 'bg-slate-100 text-slate-500',
}

export function BarraEvolucao({ conquistas, nivel }: { conquistas: Conquista[]; nivel?: string | null }) {
  const { conquistados, total, percentual, texto } = resumoEvolucao(conquistas)
  const n = apresentarNivel(nivel)

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="evolucao-titulo">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p id="evolucao-titulo" className="text-xs font-bold uppercase tracking-widest text-blue-600">Seus selos de confiança</p>
          <p className="mt-1 text-lg font-black text-slate-900" data-testid="evolucao-texto">{texto}</p>
        </div>
        <BadgeCheck className={conquistados > 0 ? 'text-green-600' : 'text-slate-300'} size={28} aria-hidden="true" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2" data-testid="nivel-atual">
        <span className="text-sm font-semibold text-slate-600">Seu nível:</span>
        <span className={`rounded-full border px-3 py-0.5 text-sm font-black ${n.classes}`} data-testid="nivel-nome">{n.nome}</span>
      </div>
      {n.proximo && <p className="mt-1 text-xs leading-snug text-slate-500" data-testid="nivel-proximo">{n.proximo}</p>}

      <div
        className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label="Evolução dos selos"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={conquistados}
        aria-valuetext={texto}
      >
        <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${percentual}%` }} />
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {conquistas.map((c) => (
          <li key={c.id} className="flex min-w-0 flex-col gap-1 rounded-xl bg-slate-50 px-3 py-2" data-testid={`conquista-${c.id}`}>
            <div className="flex min-w-0 items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-700">
                {c.estado === 'em_breve' ? <Clock size={14} aria-hidden="true" /> : <Sparkles size={14} aria-hidden="true" />}
                <span className="truncate">{c.titulo}</span>
              </span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${ESTILO[c.estado]}`}>{ROTULO[c.estado]}</span>
            </div>
            {c.detalhe && <p className="text-xs leading-snug text-slate-500">{c.detalhe}</p>}
            {c.acao && (
              <a
                href={c.acao.href}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`acao-${c.id}`}
                className="w-fit text-xs font-bold text-blue-700 underline-offset-2 hover:underline"
              >
                {c.acao.texto} →
              </a>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        Os selos são opcionais e mostram aos clientes o que foi conferido. Quem ainda não tem não perde posição na busca.
      </p>
    </section>
  )
}
