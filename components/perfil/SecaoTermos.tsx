// components/perfil/SecaoTermos.tsx

'use client'

interface SecaoTermosProps {
  aceitouTermos: boolean
  aceitouPrivacidade: boolean
  onTermosChange: (v: boolean) => void
  onPrivacidadeChange: (v: boolean) => void
}

export function SecaoTermos({
  aceitouTermos,
  aceitouPrivacidade,
  onTermosChange,
  onPrivacidadeChange,
}: SecaoTermosProps) {
  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-4">
      <label className="flex items-center gap-4 cursor-pointer group">
        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${aceitouTermos ? 'bg-blue-600 border-blue-600' : 'border-slate-200'}`}>
          <input
            type="checkbox"
            checked={aceitouTermos}
            onChange={(e) => onTermosChange(e.target.checked)}
            className="hidden"
          />
          {aceitouTermos && <span className="text-white text-xs">✓</span>}
        </div>
        <span className="text-[11px] font-bold text-slate-500 transition-colors group-hover:text-blue-600">
          Li e aceito os{' '}
          <a
            href="/termos"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLinkClick}
            className="underline hover:text-blue-600"
          >
            termos de uso
          </a>
        </span>
      </label>

      <label className="flex items-center gap-4 cursor-pointer group">
        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${aceitouPrivacidade ? 'bg-blue-600 border-blue-600' : 'border-slate-200'}`}>
          <input
            type="checkbox"
            checked={aceitouPrivacidade}
            onChange={(e) => onPrivacidadeChange(e.target.checked)}
            className="hidden"
          />
          {aceitouPrivacidade && <span className="text-white text-xs">✓</span>}
        </div>
        <span className="text-[11px] font-bold text-slate-500 transition-colors group-hover:text-blue-600">
          Li a{' '}
          <a
            href="/privacidade"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLinkClick}
            className="underline hover:text-blue-600"
          >
            política de privacidade
          </a>
        </span>
      </label>
    </section>
  )
}