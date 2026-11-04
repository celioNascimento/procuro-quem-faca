// components/acompanhamento/AvisoProjetoOutraConta.tsx
//
// Exibido quando o projeto já está vinculado a outra conta (a primeira conta
// que abriu o link é a dona). Quem está logado com outra conta continua vendo
// o andamento, mas não avalia nem aciona garantia.

import { ShieldAlert } from 'lucide-react'

export function AvisoProjetoOutraConta() {
  return (
    <section
      role="status"
      className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5 flex items-start gap-3"
    >
      <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
        <ShieldAlert size={18} className="text-amber-600" />
      </div>
      <div>
        <p className="text-[11px] font-black uppercase tracking-wide text-amber-900 leading-none mb-1">
          Projeto vinculado a outra conta
        </p>
        <p className="text-[11px] font-medium text-amber-800 leading-relaxed">
          Este serviço já está associado a outra conta. Para avaliar ou acionar a garantia,
          entre com a conta que abriu este link pela primeira vez.
        </p>
      </div>
    </section>
  )
}
