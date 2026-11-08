// components/dashboard/divulgacao/LinksPanel.tsx
'use client'
import { useMemo, useState } from 'react'
import { Check, Copy, Link2 } from 'lucide-react'
import { copiarTexto } from '@/lib/divulgacao/download'
import { urlCanonicaPerfil } from '@/lib/divulgacao/links'
import { gerarMensagens } from '@/lib/divulgacao/mensagens'
import { registrarUsoDivulgacao } from '@/lib/services/divulgacao.service'
import type { DadosDivulgacao } from '@/lib/divulgacao/tipos'

export function LinksPanel({ dados }: { dados: DadosDivulgacao }) {
  const link = urlCanonicaPerfil(dados.slug, dados.id)
  const mensagens = useMemo(() => gerarMensagens(dados, link), [dados, link])
  const [copiado, setCopiado] = useState<string | null>(null)

  async function copiar(chave: string, texto: string, acao: 'COPIAR_LINK_DIVULGACAO' | 'COPIAR_MENSAGEM_DIVULGACAO') {
    if (!(await copiarTexto(texto))) return
    setCopiado(chave)
    registrarUsoDivulgacao(dados.id, acao, chave)
    setTimeout(() => setCopiado(c => (c === chave ? null : c)), 2500)
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">Link da sua vitrine</h3>
        <p className="mt-1 text-sm text-slate-600">Seu perfil completo, com portfólio e indicações de clientes.</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input readOnly value={link} aria-label="Link da vitrine" onFocus={e => e.currentTarget.select()} className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700" />
          <button type="button" onClick={() => copiar('vitrine', link, 'COPIAR_LINK_DIVULGACAO')} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-black uppercase tracking-widest text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
            {copiado === 'vitrine' ? <Check size={15} aria-hidden="true" /> : <Link2 size={15} aria-hidden="true" />}
            {copiado === 'vitrine' ? 'Copiado' : 'Copiar link geral'}
          </button>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">Mensagens prontas para WhatsApp</h3>
        <ul className="mt-3 flex flex-col gap-3">
          {mensagens.map(m => (
            <li key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-900">{m.titulo}</p>
                  <p className="text-xs text-slate-500">{m.quando}</p>
                </div>
                <button type="button" onClick={() => copiar(m.id, m.texto, 'COPIAR_MENSAGEM_DIVULGACAO')} className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">
                  {copiado === m.id ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                  {copiado === m.id ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <p className="mt-3 whitespace-pre-line rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{m.texto}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
