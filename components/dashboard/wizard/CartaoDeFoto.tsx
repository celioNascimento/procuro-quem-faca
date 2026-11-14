// components/dashboard/wizard/CartaoDeFoto.tsx
//
// Uma das três fotos do trabalho (Antes, Durante, Depois). A descrição é opcional e fica aqui mesmo,
// salva ao sair do campo (sem janela que prende). O exemplo do "Depois" vem da categoria do prestador.
// Se a foto mostra uma pessoa, o prestador declara que tem a autorização dela.
'use client'

import { useState, type ChangeEvent } from 'react'
import { Camera, Loader2, Maximize2 } from 'lucide-react'
import {
  dicaDaDescricao, LIMITE_DESCRICAO, NOME_DA_ETAPA, SUBTITULO_DA_ETAPA, type EtapaFoto,
} from '@/lib/trabalho/descricaoFotos'

interface Props {
  etapa: EtapaFoto
  fotoUrl: string | null
  descricaoInicial: string
  exemploDaCategoria: string | null
  bloqueada: boolean
  motivoBloqueio: string
  enviando: boolean
  contemPessoas: boolean
  autorizado: boolean
  onEscolherArquivo: (evento: ChangeEvent<HTMLInputElement>) => void
  onSalvarDescricao: (texto: string) => Promise<boolean>
  onAutorizacao: (contemPessoas: boolean, autorizado: boolean) => Promise<boolean>
  onAmpliar: () => void
}

type SituacaoDoTexto = 'ocioso' | 'salvando' | 'salvo' | 'erro'

export function CartaoDeFoto({
  etapa, fotoUrl, descricaoInicial, exemploDaCategoria, bloqueada, motivoBloqueio, enviando,
  contemPessoas, autorizado, onEscolherArquivo, onSalvarDescricao, onAutorizacao, onAmpliar,
}: Props) {
  const [texto, setTexto] = useState(descricaoInicial)
  const [situacao, setSituacao] = useState<SituacaoDoTexto>('ocioso')
  const [erroAutorizacao, setErroAutorizacao] = useState(false)
  const nome = NOME_DA_ETAPA[etapa]

  const salvarTexto = async () => {
    if (texto.trim() === descricaoInicial.trim() && situacao !== 'erro') return
    setSituacao('salvando')
    const ok = await onSalvarDescricao(texto)
    setSituacao(ok ? 'salvo' : 'erro')
  }

  const mudarAutorizacao = async (pessoas: boolean, ok: boolean) => {
    setErroAutorizacao(false)
    const salvou = await onAutorizacao(pessoas, ok)
    if (!salvou) setErroAutorizacao(true)
  }

  const botaoSecundario =
    'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-700'

  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-4 sm:p-5" aria-label={`Foto do ${nome.toLowerCase()}`}>
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-slate-900">{nome}</h3>
          <p className="text-sm text-slate-600">{SUBTITULO_DA_ETAPA[etapa]}</p>
        </div>
        {fotoUrl && <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Foto enviada</span>}
      </header>

      {!fotoUrl && bloqueada ? (
        <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-600">{motivoBloqueio}</p>
      ) : !fotoUrl ? (
        <label className="mt-3 flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 text-center transition-colors hover:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100">
          {enviando ? <Loader2 size={28} className="animate-spin text-blue-500" aria-hidden="true" /> : <Camera size={28} className="text-blue-500" aria-hidden="true" />}
          <span className="px-4 text-base font-bold text-blue-700">{enviando ? 'Enviando a foto…' : 'Tirar ou escolher a foto'}</span>
          <input type="file" accept="image/*" className="sr-only" disabled={enviando} onChange={onEscolherArquivo} />
        </label>
      ) : (
        <div className="mt-3 flex flex-col gap-4">
          <button type="button" onClick={onAmpliar} className="group relative block aspect-video w-full overflow-hidden rounded-2xl bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
            <img src={fotoUrl} alt={`Foto do ${nome.toLowerCase()}`} className="size-full object-cover" />
            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-full bg-slate-950/70 px-3 py-1.5 text-xs font-bold text-white">
              <Maximize2 size={13} aria-hidden="true" /> Ampliar
            </span>
          </button>

          <label className={botaoSecundario}>
            {enviando ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Camera size={16} aria-hidden="true" />}
            {enviando ? 'Enviando…' : 'Trocar a foto'}
            <input type="file" accept="image/*" className="sr-only" disabled={enviando} onChange={onEscolherArquivo} />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-bold text-slate-700">
            Descrição (opcional)
            <textarea
              value={texto}
              onChange={(e) => { setTexto(e.target.value); if (situacao !== 'ocioso') setSituacao('ocioso') }}
              onBlur={() => void salvarTexto()}
              maxLength={LIMITE_DESCRICAO}
              rows={3}
              placeholder={dicaDaDescricao(etapa, exemploDaCategoria)}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <p role="status" className={`-mt-2 text-sm ${situacao === 'erro' ? 'font-semibold text-red-700' : 'text-slate-500'}`}>
            {situacao === 'salvando' ? 'Salvando…'
              : situacao === 'salvo' ? 'Descrição salva.'
              : situacao === 'erro' ? 'Não foi possível salvar. Toque fora do campo para tentar de novo.'
              : texto.trim() ? '' : 'Uma frase sobre a foto ajuda o cliente a avaliar.'}
          </p>

          <fieldset className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4">
            <legend className="sr-only">Pessoas na foto</legend>
            <label className="flex items-start gap-3 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={contemPessoas} onChange={(e) => void mudarAutorizacao(e.target.checked, false)} className="mt-0.5 size-5 accent-blue-600" />
              Aparece o rosto de alguma pessoa nesta foto?
            </label>
            {contemPessoas && (
              <label className="flex items-start gap-3 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={autorizado} onChange={(e) => void mudarAutorizacao(true, e.target.checked)} className="mt-0.5 size-5 accent-blue-600" />
                Tenho a autorização dessa pessoa para publicar esta foto.
              </label>
            )}
            {contemPessoas && !autorizado && (
              <p role="alert" className="text-sm font-semibold text-amber-800">
                Sem a autorização, o envio ao cliente fica bloqueado. Confirme a autorização ou troque a foto.
              </p>
            )}
            {erroAutorizacao && <p role="alert" className="text-sm font-semibold text-red-700">Não foi possível salvar essa resposta. Tente de novo.</p>}
          </fieldset>
        </div>
      )}
    </article>
  )
}
