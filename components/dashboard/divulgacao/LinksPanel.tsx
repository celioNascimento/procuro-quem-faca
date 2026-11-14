// components/dashboard/divulgacao/LinksPanel.tsx
'use client'
import { useMemo, useState } from 'react'
import { Check, Copy, Link2 } from 'lucide-react'
import { BotaoWhatsapp } from './BotaoWhatsapp'
import { copiarTexto } from '@/lib/divulgacao/download'
import { urlCanonicaPerfil } from '@/lib/divulgacao/links'
import { gerarMensagens } from '@/lib/divulgacao/mensagens'
import { registrarUsoDivulgacao } from '@/lib/services/divulgacao.service'
import type { DadosDivulgacao } from '@/lib/divulgacao/tipos'

const secundario = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100'

export function LinksPanel({ dados }: { dados: DadosDivulgacao }) {
  const link = urlCanonicaPerfil(dados.slug, dados.id)
  const mensagens = useMemo(() => gerarMensagens(dados, link), [dados, link])
  const [copiado, setCopiado] = useState<string | null>(null)
  const registrarEnvio = (chave: string) => registrarUsoDivulgacao(dados.id, 'COMPARTILHAR_WHATSAPP_DIVULGACAO', chave)

  async function copiar(chave: string, texto: string, acao: 'COPIAR_LINK_DIVULGACAO' | 'COPIAR_MENSAGEM_DIVULGACAO') {
    if (!(await copiarTexto(texto))) return
    setCopiado(chave)
    registrarUsoDivulgacao(dados.id, acao, chave)
    setTimeout(() => setCopiado(c => (c === chave ? null : c)), 2500)
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <h3 className="text-base font-black text-slate-900">Link da sua vitrine</h3>
        <p className="mt-1 text-sm text-slate-600">Seu perfil completo. Mande para quem pedir referências.</p>
        <input readOnly value={link} aria-label="Link da vitrine" onFocus={e => e.currentTarget.select()} className="mt-3 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700" />
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <BotaoWhatsapp texto={`Conheça meu trabalho: ${link}`} onAbrir={() => registrarEnvio('vitrine')} className="sm:flex-1">Enviar o link no WhatsApp</BotaoWhatsapp>
          <button type="button" onClick={() => copiar('vitrine', link, 'COPIAR_LINK_DIVULGACAO')} className={`${secundario} sm:flex-1`}>
            {copiado === 'vitrine' ? <Check size={16} aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}
            {copiado === 'vitrine' ? 'Link copiado' : 'Copiar o link'}
          </button>
        </div>
      </section>

      <section>
        <h3 className="text-base font-black text-slate-900">Mensagens prontas para WhatsApp</h3>
        <p className="mt-1 text-sm text-slate-600">Escolha a mensagem, toque em enviar e o WhatsApp abre com o texto pronto para você escolher quem recebe.</p>
        <ul className="mt-3 flex flex-col gap-3">
          {mensagens.map(m => (
            <li key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div>
                <p className="text-sm font-black text-slate-900">{m.titulo}</p>
                <p className="text-sm text-slate-500">{m.quando}</p>
              </div>
              <p className="mt-3 whitespace-pre-line rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{m.texto}</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <BotaoWhatsapp texto={m.texto} onAbrir={() => registrarEnvio(m.id)} className="sm:flex-1" />
                <button type="button" onClick={() => copiar(m.id, m.texto, 'COPIAR_MENSAGEM_DIVULGACAO')} className={`${secundario} sm:flex-1`}>
                  {copiado === m.id ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                  {copiado === m.id ? 'Mensagem copiada' : 'Copiar mensagem'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
