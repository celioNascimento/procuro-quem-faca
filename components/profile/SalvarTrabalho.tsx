// components/profile/SalvarTrabalho.tsx — marcador "Salvar" (só o ícone) no rodapé do modal do trabalho.
import { Bookmark } from 'lucide-react'

interface Props {
  salvo: boolean
  onSalvar: () => void
}

export function SalvarTrabalho({ salvo, onSalvar }: Props) {
  return (
    <button
      type="button" onClick={onSalvar} aria-pressed={salvo} data-testid="modal-salvar"
      aria-label={salvo ? 'Remover dos salvos' : 'Salvar este trabalho'} title={salvo ? 'Remover dos salvos' : 'Salvar este trabalho'}
      className={`flex size-12 shrink-0 items-center justify-center rounded-2xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${salvo ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700'}`}
    >
      <Bookmark size={20} aria-hidden="true" fill={salvo ? 'currentColor' : 'none'} />
    </button>
  )
}
