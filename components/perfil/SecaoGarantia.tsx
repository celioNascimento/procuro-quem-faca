// components/perfil/SecaoGarantia.tsx
//
// Seletor de garantia_dias, reaproveitado por /cadastro (FormularioCadastro)
// e EditarPerfilTab (dashboard).
//
// Postura comercial declarada pelo prestador — não é a garantia legal do
// CDC, que se aplica sempre independente deste valor. A nota deixa isso
// explícito para não criar falsa expectativa de que "sem garantia"
// significa "sem direito nenhum" para o cliente.

import { ShieldCheck } from 'lucide-react'
import type { GarantiaDias } from '@/types/prestador'
import { CartaoSecao } from '@/components/perfil/CartaoSecao'

interface Props {
  garantiaDias: GarantiaDias | undefined
  onChange: (dias: GarantiaDias) => void
}

const OPCOES: { valor: GarantiaDias; label: string }[] = [
  { valor: 0, label: 'Sem garantia' },
  { valor: 30, label: '30 dias' },
  { valor: 60, label: '60 dias' },
  { valor: 90, label: '90 dias' },
]

export function SecaoGarantia({ garantiaDias, onChange }: Props) {
  const valorAtual = garantiaDias ?? 0

  return (
    <CartaoSecao
      titulo="Garantia do seu serviço"
      descricao="Um prazo de garantia passa confiança e ajuda você a se destacar na busca."
      icone={<ShieldCheck size={20} />}
    >
      <div role="group" aria-label="Prazo de garantia" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {OPCOES.map((opcao) => {
          const ativo = valorAtual === opcao.valor
          return (
            <button
              key={opcao.valor}
              type="button"
              aria-pressed={ativo}
              onClick={() => onChange(opcao.valor)}
              className={`flex min-h-14 flex-col items-center justify-center rounded-xl border px-2 py-2 text-center transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${
                ativo
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {opcao.valor === 0 ? (
                <span className="text-sm font-bold">Sem garantia</span>
              ) : (
                <>
                  <span className="text-lg font-black leading-none">{opcao.valor}</span>
                  <span className="mt-1 text-xs font-semibold">dias</span>
                </>
              )}
            </button>
          )
        })}
      </div>

      <p className="border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">
        Independente da garantia declarada aqui, o cliente tem os direitos garantidos pelo Código de Defesa do
        Consumidor. O PQF não se responsabiliza pela garantia oferecida — atua apenas como facilitador de contato.
      </p>
    </CartaoSecao>
  )
}
