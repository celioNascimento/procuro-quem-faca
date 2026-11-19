// components/dashboard/dados-profissionais/CnaesDoCnpj.tsx
// Seta que abre e fecha com as atividades (CNAE) registradas no CNPJ. Só exibe; quem calcula é o hook/banco.
'use client'

import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { listarCnaes } from '@/lib/cnpj/cnaes'
import type { DadosSeloCnpj } from '@/lib/selos/cnpjEstado'

export function CnaesDoCnpj({ cnpj, compativeis }: { cnpj: DadosSeloCnpj['cnpj']; compativeis: string[] }) {
  const [aberto, setAberto] = useState(false)
  const itens = listarCnaes(cnpj, compativeis)
  if (itens.length === 0) return null
  const combinam = itens.filter((i) => i.combina).length

  return (
    <div className="mt-3" data-testid="cnaes-do-cnpj">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls="lista-cnaes"
        data-testid="cnaes-alternar"
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-1 text-left text-sm font-bold text-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-200"
      >
        <span>
          Atividades registradas no CNPJ ({itens.length})
          {combinam > 0 && <span className="ml-2 text-xs font-semibold text-green-700">{combinam} combina com o seu perfil</span>}
        </span>
        <ChevronDown size={18} aria-hidden="true" className={`shrink-0 transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </button>
      {aberto && (
        <>
          <ul id="lista-cnaes" className="mt-2 flex flex-col gap-2" data-testid="cnaes-lista">
            {itens.map((i) => (
              <li key={i.codigo} className="rounded-xl bg-white/70 px-3 py-2 text-sm text-slate-700" data-testid={`cnae-${i.codigo}`}>
                <span className="font-bold text-slate-900">{i.formatado}</span>
                {i.principal && <span className="ml-2 rounded-full bg-green-100 px-2 py-px text-xs font-bold text-green-800">Principal</span>}
                {i.combina && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-green-600 px-2 py-px text-xs font-bold text-white">
                    <Check size={12} aria-hidden="true" /> Combina com o seu perfil
                  </span>
                )}
                {i.descricao && <span className="mt-0.5 block text-xs leading-snug text-slate-600">{i.descricao}</span>}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs leading-snug text-slate-600">
            Estas são as atividades que a Receita Federal registra para o seu CNPJ. O selo de atividade aparece quando alguma delas combina com a sua categoria.
          </p>
        </>
      )}
    </div>
  )
}
