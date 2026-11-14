// components/ui/Dialogo.tsx
//
// Caixas de aviso e de confirmação no tom calmo do app, acessíveis (role="dialog", nome e descrição,
// Esc, foco preso, toque no fundo fecha). Substituem as caixas feitas à mão e o window.confirm.
// (ErrorModal e ModalConfirmacao, mais antigos, seguem em uso no cadastro e no painel do prestador.)
'use client'

import { useId, useRef, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { useDialogoAcessivel } from '@/hooks/useDialogoAcessivel'

type BaseProps = {
  aberto: boolean
  titulo: string
  mensagem: ReactNode
  onFechar: () => void
  /** Ícone no topo; padrão: alerta. */
  tom?: 'aviso' | 'perigo'
  children: ReactNode
}

function CaixaBase({ aberto, titulo, mensagem, onFechar, tom = 'aviso', children }: BaseProps) {
  const ref = useRef<HTMLDivElement>(null)
  const idTitulo = useId()
  const idMensagem = useId()
  useDialogoAcessivel(ref, aberto, onFechar)

  if (!aberto) return null

  const icone = tom === 'perigo' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-5 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={e => { if (e.target === e.currentTarget) onFechar() }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={idMensagem}
        className="flex w-full max-w-sm flex-col gap-5 rounded-[2rem] border border-slate-100 bg-white p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200 sm:p-8"
      >
        <div className={`mx-auto flex size-14 items-center justify-center rounded-2xl border ${icone}`}>
          <AlertCircle size={28} aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 id={idTitulo} className="text-xl font-bold text-slate-900">{titulo}</h2>
          <p id={idMensagem} className="text-base leading-relaxed text-slate-600">{mensagem}</p>
        </div>
        {children}
      </div>
    </div>
  )
}

const botaoPrimario = 'min-h-12 w-full rounded-2xl bg-blue-600 px-5 text-base font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 active:scale-[0.98]'
const botaoPerigo = 'min-h-12 w-full rounded-2xl bg-red-600 px-5 text-base font-bold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 active:scale-[0.98]'
const botaoSecundario = 'min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 text-base font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 active:scale-[0.98]'

export function DialogoAviso({
  aberto, titulo, mensagem, onFechar, textoBotao = 'Entendi', tom = 'perigo',
}: Omit<BaseProps, 'children'> & { textoBotao?: string }) {
  return (
    <CaixaBase aberto={aberto} titulo={titulo} mensagem={mensagem} onFechar={onFechar} tom={tom}>
      <button type="button" onClick={onFechar} className={botaoPrimario}>{textoBotao}</button>
    </CaixaBase>
  )
}

export function DialogoConfirmacao({
  aberto, titulo, mensagem, onCancelar, onConfirmar,
  textoConfirmar = 'Confirmar', textoCancelar = 'Cancelar', perigo = false,
}: Omit<BaseProps, 'children' | 'onFechar' | 'tom'> & {
  onCancelar: () => void
  onConfirmar: () => void
  textoConfirmar?: string
  textoCancelar?: string
  perigo?: boolean
}) {
  return (
    <CaixaBase aberto={aberto} titulo={titulo} mensagem={mensagem} onFechar={onCancelar} tom={perigo ? 'perigo' : 'aviso'}>
      <div className="flex flex-col gap-2.5">
        {/* O botão seguro (cancelar) vem primeiro: é ele que recebe o foco ao abrir. */}
        <button type="button" onClick={onCancelar} className={botaoSecundario}>{textoCancelar}</button>
        <button type="button" onClick={onConfirmar} className={perigo ? botaoPerigo : botaoPrimario}>{textoConfirmar}</button>
      </div>
    </CaixaBase>
  )
}
