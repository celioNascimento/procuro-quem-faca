// components/perfil/SecaoDadosPessoais.tsx

'use client'

import { Check, UserRound, X } from 'lucide-react'
import { CartaoSecao, Campo } from '@/components/perfil/CartaoSecao'

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
  const mostrarSituacaoDoLink = !checandoSlug && !!slug && slug.length > 2

  return (
    <CartaoSecao
      titulo="Seus dados"
      descricao="É assim que os clientes vão te encontrar e falar com você."
      icone={<UserRound size={20} />}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Campo id="perfil-nome" rotulo="Nome profissional">
          <input
            id="perfil-nome"
            value={nome || ''}
            placeholder="Ex.: Elétrica Silva"
            onChange={e => onNomeChange(e.target.value)}
            className={inputStyle}
            required
          />
        </Campo>

        <Campo id="perfil-whatsapp" rotulo="Seu WhatsApp" dica="Os clientes vão chamar você por este número.">
          <input
            id="perfil-whatsapp"
            type="tel"
            inputMode="tel"
            value={whatsapp || ''}
            placeholder="(00) 00000-0000"
            onChange={e => onWhatsappChange(e.target.value)}
            className={inputStyle}
            required
          />
        </Campo>
      </div>

      <Campo id="perfil-slug" rotulo="Endereço do seu perfil" dica="É o link que você divulga. Use só letras, números e hífen.">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
          <span className="hidden shrink-0 text-sm font-medium text-slate-400 md:inline">procuroquemfaca.com.br/</span>
          <input
            id="perfil-slug"
            value={slug || ''}
            onChange={e => onSlugChange(e.target.value)}
            className="min-w-0 flex-1 bg-transparent py-1 text-base font-bold text-blue-600 outline-none placeholder:font-medium placeholder:text-slate-400 sm:text-[15px]"
            placeholder="seu-nome"
            autoCapitalize="none"
            autoCorrect="off"
          />
          {checandoSlug && <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" role="status" aria-label="Verificando disponibilidade" />}
          {mostrarSituacaoDoLink && (slugDisponivel
            ? <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-emerald-600"><Check size={14} aria-hidden="true" />Disponível</span>
            : <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-red-600"><X size={14} aria-hidden="true" />Já existe</span>)}
        </div>
      </Campo>

      <Campo id="perfil-bio" rotulo="Apresentação" opcional dica="Duas ou três frases sobre o que você faz de melhor.">
        <textarea
          id="perfil-bio"
          value={bio || ''}
          placeholder="Ex.: Mais de 10 anos instalando e consertando redes elétricas residenciais."
          onChange={e => onBioChange(e.target.value)}
          className={`${inputStyle} h-28 resize-none`}
        />
      </Campo>
    </CartaoSecao>
  )
}
