// components/Footer.tsx

import Link from 'next/link'

export default function Footer() {
  const anoAtual = new Date().getFullYear()
  const emailContato = 'procuroquemfaca@gmail.com'

  return (
    <footer className="w-full bg-white border-t border-slate-100 py-4 mt-auto">
      <div className="max-w-5xl mx-auto px-6 flex flex-col items-center gap-2">
        
        {/* Navegação Principal */}
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-1">
          <Link 
            href="/privacidade" 
            className="inline-flex min-h-11 items-center text-slate-600 hover:text-blue-600 text-sm font-semibold transition-colors"
          >
            Privacidade
          </Link>
          <Link 
            href="/titular" 
            className="inline-flex min-h-11 items-center text-slate-600 hover:text-blue-600 text-sm font-semibold transition-colors"
          >
            Seus dados
          </Link>
          <Link 
            href="/termos" 
            className="inline-flex min-h-11 items-center text-slate-600 hover:text-blue-600 text-sm font-semibold transition-colors"
          >
            Termos
          </Link>
          <Link 
            href="/quem-somos" 
            className="inline-flex min-h-11 items-center text-slate-600 hover:text-blue-600 text-sm font-semibold transition-colors"
          >
            Quem somos
          </Link>
          
          {/* Fale Conosco via E-mail */}
          <a 
            href={`mailto:${emailContato}?subject=Contato via Portal Procuro Quem Faça`}
            className="inline-flex min-h-11 items-center text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors"
            title={emailContato}
          >
            Fale Conosco
          </a>
        </nav>

        {/* Linha Divisória Sutil */}
        <div className="w-12 h-[1px] bg-slate-100"></div>

        {/* Créditos e Copyright */}
        <div className="text-center">
          <p className="text-slate-500 text-xs font-medium">
            © {anoAtual} <span className="text-slate-900 font-black tracking-tight uppercase">Procuro Quem Faça</span>
          </p>
        </div>

      </div>
    </footer>
  )
}
