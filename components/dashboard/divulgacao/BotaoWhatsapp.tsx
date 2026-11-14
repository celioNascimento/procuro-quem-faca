// components/dashboard/divulgacao/BotaoWhatsapp.tsx
//
// Abre o WhatsApp com a mensagem pronta; a pessoa escolhe quem recebe. É um link (não um botão com
// espera) para o navegador nunca bloquear a janela, principalmente no celular.
import { MessageCircle } from 'lucide-react'
import { enderecoWhatsappComTexto } from '@/lib/divulgacao/whatsapp'

interface Props {
  texto: string
  onAbrir?: () => void
  className?: string
  children?: React.ReactNode
}

export function BotaoWhatsapp({ texto, onAbrir, className = '', children = 'Enviar no WhatsApp' }: Props) {
  return (
    <a
      href={enderecoWhatsappComTexto(texto)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onAbrir}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${className}`}
    >
      <MessageCircle size={16} aria-hidden="true" />
      {children}
    </a>
  )
}
