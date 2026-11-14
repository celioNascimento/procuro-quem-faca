// components/Footer.tsx

import Link from 'next/link'

export default function Footer() {
  const anoAtual = new Date().getFullYear()
  const emailContato = 'procuroquemfaca@gmail.com'

  return (
    <footer className="w-full bg-white border-t border-slate-100 pt-1 mt-auto">
      <div className="max-w-5xl mx-auto px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex flex-col items-center">
        
        {/* Navegação Principal */}
        <nav className="flex flex-wrap justify-center gap-x-5">
          <Link 
            href="/privacidade" 
            className="inline-flex min-h-7 items-center text-slate-600 hover:text-blue-600 text-sm font-semibold transition-colors"
          >
            Privacidade
          </Link>
          <Link 
            href="/titular" 
            className="inline-flex min-h-7 items-center text-slate-600 hover:text-blue-600 text-sm font-semibold transition-colors"
          >
            Seus dados
          </Link>
          <Link 
            href="/termos" 
            className="inline-flex min-h-7 items-center text-slate-600 hover:text-blue-600 text-sm font-semibold transition-colors"
          >
            Termos
          </Link>
          <Link 
            href="/quem-somos" 
            className="inline-flex min-h-7 items-center text-slate-600 hover:text-blue-600 text-sm font-semibold transition-colors"
          >
            Quem somos
          </Link>
          
          {/* Fale Conosco via E-mail */}
          <a 
            href={`mailto:${emailContato}?subject=Contato via Portal Procuro Quem Faça`}
            className="inline-flex min-h-7 items-center text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors"
            title={emailContato}
          >
            Fale Conosco
          </a>
        </nav>

        {/* Créditos e Copyright */}
        <div className="mt-3 text-center">
          <p className="text-slate-500 text-xs font-medium">
            © {anoAtual} <span className="text-slate-900 font-black tracking-tight uppercase">Procuro Quem Faça</span>
          </p>
        </div>

      </div>
    </footer>
  )
}
