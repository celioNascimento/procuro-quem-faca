//components/perfil/SecaoDadosPessoais.tsx

'use client'

interface SecaoDadosPessoaisProps {
  nome: string
  slug: string | null
  whatsapp: string
  bio?: string
  slugDisponivel: boolean
  checandoSlug: boolean
  inputStyle: string
  onNomeChange: (v: string) => void
  onSlugChange: (v: string) => void
  onWhatsappChange: (v: string) => void
  onBioChange: (v: string) => void
}

export function SecaoDadosPessoais({
  nome,
  slug,
  whatsapp,
  bio,
  slugDisponivel,
  checandoSlug,
  inputStyle,
  onNomeChange,
  onSlugChange,
  onWhatsappChange,
  onBioChange,
}: SecaoDadosPessoaisProps) {
  return (
    <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-5">
      <div className="space-y-4">
        <input
          value={nome || ''}
          placeholder="Nome Profissional"
          onChange={e => onNomeChange(e.target.value)}
          className={inputStyle}
          required
        />

        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 relative overflow-hidden">
          <label className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-2 block">
            Link do seu perfil (slug)
          </label>
          <div className="flex items-center gap-1 font-bold text-sm">
            <span className="text-slate-400 font-medium hidden md:inline">procuroquemfaca.com.br/</span>
            <input
              value={slug || ''}
              onChange={e => onSlugChange(e.target.value)}
              className="bg-transparent border-none outline-none text-blue-600 font-bold flex-1 min-w-0"
              placeholder="seu-nome"
            />
            {checandoSlug
              ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              : (slug && slug.length > 2) && (
                  slugDisponivel
                    ? <span className="text-green-500 text-xs">✅ Disponível</span>
                    : <span className="text-red-500 text-xs">❌ Já existe</span>
                )
            }
          </div>
        </div>

        <input
          value={whatsapp || ''}
          placeholder="Seu WhatsApp"
          onChange={e => onWhatsappChange(e.target.value)}
          className={inputStyle}
          required
        />

        <textarea
          value={bio || ''}
          placeholder="Bio rápida: Conte o que você faz de melhor..."
          onChange={e => onBioChange(e.target.value)}
          className={`${inputStyle} h-32 resize-none`}
        />
      </div>
    </section>
  )
}