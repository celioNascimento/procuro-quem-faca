// components/dashboard/wizard/AvisoDeVisibilidade.tsx
//
// Diz ao prestador, antes de ele enviar as fotos, quem as vê. Regra: no perfil público só depois do
// aceite do cliente. Muda de texto e de cor quando o cliente aceita.
import { Eye, Lock } from 'lucide-react'
import { visibilidadeDasFotos } from '@/lib/trabalho/visibilidade'

export function AvisoDeVisibilidade({ status }: { status: string | null | undefined }) {
  const v = visibilidadeDasFotos(status)
  const Icone = v.publico ? Eye : Lock
  return (
    <aside
      aria-label="Quem vê as fotos deste trabalho"
      className={`flex items-start gap-3 rounded-3xl border p-4 ${v.publico ? 'border-emerald-200 bg-emerald-50' : 'border-blue-100 bg-blue-50'}`}
    >
      <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${v.publico ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
        <Icone size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className={`text-sm font-black ${v.publico ? 'text-emerald-900' : 'text-blue-900'}`}>{v.titulo}</p>
        <p className={`mt-0.5 text-sm ${v.publico ? 'text-emerald-900' : 'text-blue-900'}`}>{v.texto}</p>
      </div>
    </aside>
  )
}
