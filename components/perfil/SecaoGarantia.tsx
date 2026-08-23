// components/perfil/SecaoGarantia.tsx
//
// Seletor de garantia_dias, reaproveitado por /cadastro (FormularioCadastro)
// e EditarPerfilTab (dashboard). Segue o mesmo padrão visual das demais
// seções (SecaoOQueVoceFaz, SecaoDadosPessoais, SecaoLocalizacao): card
// branco arredondado com label uppercase.
//
// Postura comercial declarada pelo prestador — não é a garantia legal do
// CDC, que se aplica sempre independente deste valor. O tooltip/nota deixa
// isso explícito para não criar falsa expectativa de que "sem garantia"
// significa "sem direito nenhum" para o cliente.

import { ShieldCheck } from 'lucide-react'
import type { GarantiaDias } from '@/types/prestador'

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
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck size={16} className="text-blue-600" />
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Garantia do seu serviço
        </h3>
      </div>

      <p className="text-[12px] font-medium text-slate-500 leading-relaxed">
        Ofereça um prazo de garantia para transmitir mais confiança aos clientes.
        Prestadores com garantia declarada se destacam na busca.
      </p>

      <div className="grid grid-cols-4 gap-2">
        {OPCOES.map((opcao) => {
          const ativo = valorAtual === opcao.valor
          return (
            <button
              key={opcao.valor}
              type="button"
              onClick={() => onChange(opcao.valor)}
              className={`min-h-14 flex flex-col items-center justify-center rounded-2xl border transition-all text-center px-1 ${
                ativo
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600'
              }`}
            >
              <span className="text-[11px] font-black">
                {opcao.valor === 0 ? '—' : opcao.valor}
              </span>
              <span className="text-[8px] font-bold uppercase tracking-wide leading-tight mt-0.5">
                {opcao.valor === 0 ? 'Nenhuma' : 'dias'}
              </span>
            </button>
          )
        })}
      </div>

      <p className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-50 pt-3">
        Independente da garantia declarada aqui, o cliente tem direitos garantidos pelo
        Código de Defesa do Consumidor. O PQF não se responsabiliza pela garantia
        oferecida — atua apenas como facilitador de contato.
      </p>
    </div>
  )
}
