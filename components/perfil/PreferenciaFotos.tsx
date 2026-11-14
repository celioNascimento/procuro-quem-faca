'use client'

import { Camera } from 'lucide-react'
import { CartaoSecao } from '@/components/perfil/CartaoSecao'

interface PreferenciaFotosProps {
  valor: boolean
  onChange: (valor: boolean) => void
  modo?: 'cadastro' | 'edicao'
}

export function PreferenciaFotos({ valor, onChange, modo = 'edicao' }: PreferenciaFotosProps) {
  return (
    <CartaoSecao
      titulo="Ao registrar um trabalho"
      descricao="Escolha como você prefere começar. Dá para mudar em cada trabalho."
      icone={<Camera size={20} />}
    >
      <div role="group" aria-label="Como começar um trabalho" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {[
          { v: true, titulo: 'Com registro de fotos', texto: 'Mostra o seu trabalho no perfil.' },
          { v: false, titulo: 'Sem fotos', texto: 'Só registra o serviço e o cliente.' },
        ].map(op => (
          <button
            key={String(op.v)}
            type="button"
            aria-pressed={valor === op.v}
            onClick={() => onChange(op.v)}
            className={`flex min-h-16 flex-col items-start gap-0.5 rounded-xl border-2 p-3.5 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${valor === op.v ? 'border-blue-600 bg-blue-50/60' : 'border-slate-200 bg-white hover:border-blue-300'}`}
          >
            <span className="text-sm font-bold text-slate-800">{op.titulo}</span>
            <span className="text-xs text-slate-500">{op.texto}</span>
          </button>
        ))}
      </div>
      {modo === 'cadastro' && (
        <p className="text-xs text-slate-500">Essa é só a escolha inicial: não obriga fotos em nenhum trabalho.</p>
      )}
    </CartaoSecao>
  )
}
