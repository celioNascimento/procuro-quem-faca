import Link from 'next/link'
import { Phone, ExternalLink } from 'lucide-react'

interface Props {
  nome: string
  foto: string | null
  whatsapp: string
  slug: string | null
}

/**
 * Card horizontal do prestador exibido ACIMA do WizardForm.
 * Substitui a coluna esquerda que ficava dentro do wizard.
 *
 * Uso em PortfolioDashboardTab (ou onde o wizard é montado):
 *
 *   <PrestadorCardHorizontal
 *     nome={hookData.state.prestadorInfo.nome}
 *     foto={hookData.state.prestadorInfo.foto}
 *     whatsapp={hookData.state.prestadorInfo.whatsapp}
 *     slug={hookData.state.prestadorInfo.slug}
 *   />
 *   <WizardForm hookData={hookData} />
 */
export function PrestadorCardHorizontal({ nome, foto, whatsapp, slug }: Props) {
  return (
    <div className="flex items-center gap-4 bg-white border border-slate-100 rounded-2xl px-5 py-4 mb-5">

      {/* Avatar */}
      <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
        {foto ? (
          <img src={foto} alt={nome} className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg font-black text-slate-400 uppercase">
            {nome?.[0] ?? 'P'}
          </span>
        )}
      </div>

      {/* Nome + slug */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 leading-none truncate">
          {nome || 'Seu nome'}
        </p>
        {slug && (
          <p className="text-[11px] text-blue-500 mt-0.5">@{slug}</p>
        )}
      </div>

      {/* WhatsApp */}
      {whatsapp && (
        <div className="hidden sm:flex items-center gap-2 text-slate-500">
          <Phone size={13} className="text-slate-300 shrink-0" />
          <span className="text-[13px] font-semibold">{whatsapp}</span>
        </div>
      )}

      {/* Ver perfil */}
      {slug && (
        <Link
          href={`/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
        >
          <ExternalLink size={12} />
          <span className="hidden sm:inline">Ver perfil</span>
        </Link>
      )}

    </div>
  )
}