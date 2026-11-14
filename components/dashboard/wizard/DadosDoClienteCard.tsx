// components/dashboard/wizard/DadosDoClienteCard.tsx
//
// Passo 1 do trabalho: quem é o cliente e qual foi o serviço. Três momentos: preencher (trabalho
// novo), conferir (resumo) e corrigir (enquanto o cliente ainda não aceitou).
'use client'

import { AlertCircle, Loader2, Pencil } from 'lucide-react'
import type { useUploadWizard } from '@/hooks/useUploadWizard'
import { seloDoTrabalho } from '@/lib/trabalho/statusTrabalho'

interface Props {
  hookData: ReturnType<typeof useUploadWizard>
}

const campo =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100'

export function DadosDoClienteCard({ hookData }: Props) {
  const { clienteWhatsapp, clienteNome, titulo, projetoId, projetosEncontrados, editandoDadosCliente, salvandoDadosCliente, erroDadosCliente } = hookData.state
  const { isSelfNumber, isPhoneValid, isTitleValid, isProjetoPendente } = hookData.derived
  const {
    setClienteWhatsapp, setClienteNome, setTitulo, selecionarProjeto,
    iniciarEdicaoDadosCliente, cancelarEdicaoDadosCliente, salvarDadosCliente,
  } = hookData.actions

  const emResumo = !!projetoId && !editandoDadosCliente

  if (emResumo) {
    return (
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-4 sm:p-5" aria-label="Dados do cliente e do serviço">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-black text-slate-900">Cliente e serviço</h3>
          {isProjetoPendente && (
            <button type="button" onClick={iniciarEdicaoDadosCliente} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700">
              <Pencil size={14} aria-hidden="true" /> Corrigir dados
            </button>
          )}
        </div>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div><dt className="font-bold text-slate-500">Serviço</dt><dd className="mt-0.5 font-semibold text-slate-900">{titulo || '—'}</dd></div>
          <div><dt className="font-bold text-slate-500">Cliente</dt><dd className="mt-0.5 font-semibold text-slate-900">{clienteNome || 'Sem nome informado'}</dd></div>
          <div><dt className="font-bold text-slate-500">WhatsApp do cliente</dt><dd className="mt-0.5 font-semibold text-slate-900">{clienteWhatsapp || '—'}</dd></div>
        </dl>
      </section>
    )
  }

  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-4 sm:p-5" aria-label="Dados do cliente e do serviço">
      <h3 className="text-base font-black text-slate-900">{editandoDadosCliente ? 'Corrigir dados' : 'Quem é o cliente e qual foi o serviço?'}</h3>
      <p className="mt-0.5 text-sm text-slate-600">O cliente recebe o link do acompanhamento pelo WhatsApp. É assim que o trabalho ganha aceite e avaliação.</p>

      <div className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-bold text-slate-700">
          WhatsApp do cliente
          <input
            type="tel"
            inputMode="tel"
            autoComplete="off"
            value={clienteWhatsapp}
            onChange={(e) => setClienteWhatsapp(e.target.value)}
            placeholder="(00) 90000-0000"
            aria-invalid={isSelfNumber}
            className={`${campo} ${isSelfNumber ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
          />
          <span className={`text-sm font-medium ${isSelfNumber ? 'text-red-700' : 'text-slate-500'}`}>
            {isSelfNumber ? 'Use o número do cliente, não o seu.' : 'Com DDD. Ex.: (43) 99999-0000.'}
          </span>
        </label>

        {!projetoId && projetosEncontrados.length > 0 && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4" role="group" aria-label="Trabalhos deste cliente">
            <p className="text-sm font-bold text-blue-900">Este cliente já tem {projetosEncontrados.length === 1 ? 'um trabalho' : `${projetosEncontrados.length} trabalhos`} com você. Quer continuar um deles?</p>
            <ul className="mt-3 flex flex-col gap-2">
              {projetosEncontrados.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => selecionarProjeto(p)} className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-left transition-colors hover:border-blue-400">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-slate-900">{p.titulo}</span>
                      <span className="block text-xs font-medium text-slate-500">{seloDoTrabalho({ status: p.status }).texto}</span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-blue-700">Continuar</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-blue-900">Ou siga preenchendo para registrar um trabalho novo.</p>
          </div>
        )}

        <label className="flex flex-col gap-1.5 text-sm font-bold text-slate-700">
          Nome do cliente (opcional)
          <input value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} disabled={!isPhoneValid} placeholder="Como o cliente se chama" className={`${campo} disabled:bg-slate-50 disabled:text-slate-400`} />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-bold text-slate-700">
          Nome do serviço
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} disabled={!isPhoneValid} maxLength={80} placeholder="O que você fez para este cliente, em poucas palavras" className={`${campo} disabled:bg-slate-50 disabled:text-slate-400`} />
          <span className="text-sm font-medium text-slate-500">{isPhoneValid ? 'Mínimo de 4 letras.' : 'Preencha primeiro o WhatsApp do cliente.'}</span>
        </label>
      </div>

      {editandoDadosCliente && (
        <div className="mt-4 flex flex-col gap-3">
          {erroDadosCliente && <p role="alert" className="flex items-start gap-2 text-sm font-semibold text-red-700"><AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{erroDadosCliente}</p>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={cancelarEdicaoDadosCliente} disabled={salvandoDadosCliente} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-base font-bold text-slate-700 hover:border-slate-400 disabled:opacity-50">
              Cancelar
            </button>
            <button type="button" onClick={salvarDadosCliente} disabled={salvandoDadosCliente || !isPhoneValid || !isTitleValid} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-base font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">
              {salvandoDadosCliente ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Salvando…</> : 'Salvar alterações'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
