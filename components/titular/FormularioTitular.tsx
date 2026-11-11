// components/titular/FormularioTitular.tsx
//
// Formulário de pedido do titular de dados (LGPD). Usado em /titular e em /reivindicar.

'use client'

import Link from 'next/link'
import { CONTROLADOR } from '@/config/controlador'
import { useFormularioTitular } from '@/hooks/useFormularioTitular'
import { ROTULO_TIPO_PEDIDO, TIPOS_PEDIDO, type TipoPedido } from '@/lib/titular/pedido'

interface FormularioTitularProps {
  prestadorId?: number | null
  prestadorNome?: string | null
  tipoInicial?: TipoPedido
}

const campo =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100'

export function FormularioTitular({ prestadorId = null, prestadorNome = null, tipoInicial }: FormularioTitularProps) {
  const {
    tipo, setTipo, nome, setNome, contato, setContato, descricao, setDescricao, website, setWebsite,
    enviando, erros, erroGeral, confirmacao, enviar,
  } = useFormularioTitular({ prestadorId, tipoInicial })

  if (confirmacao) {
    return (
      <div role="status" className="space-y-4 rounded-[2rem] border border-emerald-100 bg-emerald-50 p-8 text-left">
        <h2 className="text-lg font-black text-emerald-900">Pedido recebido</h2>
        <p className="text-sm leading-relaxed text-emerald-900/80">
          Seu protocolo é <strong className="font-mono text-emerald-900">{confirmacao.protocolo}</strong>. Respondemos em até {confirmacao.prazoDias} dias, pelo contato que você informou.
        </p>
        {prestadorId && (
          <p className="text-sm leading-relaxed text-emerald-900/80">
            Para sua segurança, se o pedido for sobre um perfil, enviaremos o link para assumir, corrigir ou excluir ao WhatsApp cadastrado no próprio perfil.
          </p>
        )}
        <p className="text-sm text-emerald-900/70">
          Como tratamos seus dados: <Link href="/privacidade" className="font-bold underline">Política de Privacidade</Link>.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-5 text-left">
      {prestadorNome && (
        <p className="rounded-2xl bg-slate-50 px-4 py-3 text-[12px] font-bold text-slate-600">
          Perfil: <span className="text-blue-600">{prestadorNome}</span>
        </p>
      )}

      <fieldset className="space-y-2">
        <legend className="mb-2 text-[11px] font-black uppercase tracking-widest text-slate-400">O que você precisa?</legend>
        {TIPOS_PEDIDO.map(opcao => (
          <label key={opcao} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-700 has-[:checked]:border-blue-300 has-[:checked]:bg-blue-50">
            <input
              type="radio"
              name="tipo"
              value={opcao}
              checked={tipo === opcao}
              onChange={() => setTipo(opcao)}
              className="size-4 accent-blue-600"
            />
            {ROTULO_TIPO_PEDIDO[opcao]}
          </label>
        ))}
        {erros.tipo && <p role="alert" className="text-[12px] font-semibold text-red-600">{erros.tipo}</p>}
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor="titular-nome" className="text-[11px] font-black uppercase tracking-widest text-slate-400">Seu nome (opcional)</label>
        <input id="titular-nome" value={nome} onChange={e => setNome(e.target.value)} maxLength={200} autoComplete="name" className={campo} />
        {erros.nome && <p role="alert" className="text-[12px] font-semibold text-red-600">{erros.nome}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="titular-contato" className="text-[11px] font-black uppercase tracking-widest text-slate-400">E-mail ou WhatsApp para resposta</label>
        <input
          id="titular-contato"
          value={contato}
          onChange={e => setContato(e.target.value)}
          maxLength={200}
          autoComplete="email"
          aria-invalid={Boolean(erros.contato)}
          placeholder="voce@exemplo.com ou (43) 99999-9999"
          className={campo}
        />
        {erros.contato && <p role="alert" className="text-[12px] font-semibold text-red-600">{erros.contato}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="titular-descricao" className="text-[11px] font-black uppercase tracking-widest text-slate-400">
          {tipo === 'outro' ? 'Conte o seu pedido' : 'Detalhes (opcional)'}
        </label>
        <textarea id="titular-descricao" value={descricao} onChange={e => setDescricao(e.target.value)} rows={4} maxLength={2000} className={`${campo} resize-none`} />
        {erros.descricao && <p role="alert" className="text-[12px] font-semibold text-red-600">{erros.descricao}</p>}
      </div>

      {/* Campo-isca: invisível para pessoas, preenchido por robôs */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Não preencha este campo
          <input tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} />
        </label>
      </div>

      {erroGeral && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-[12px] font-semibold text-red-600">{erroGeral}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-[2rem] bg-blue-600 py-5 text-[12px] font-bold uppercase tracking-widest text-white shadow-xl shadow-blue-100 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
      >
        {enviando ? 'Enviando...' : 'Enviar pedido'}
      </button>

      <p className="text-[11px] leading-relaxed text-slate-400">
        Usamos estes dados só para responder ao seu pedido, em até {CONTROLADOR.prazoRespostaDias} dias. Veja a{' '}
        <Link href="/privacidade" className="font-bold text-blue-600 underline">Política de Privacidade</Link>.
      </p>
    </form>
  )
}
