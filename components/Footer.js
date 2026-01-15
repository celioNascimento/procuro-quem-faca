import Link from 'next/link'

export default function Footer() {
  const anoAtual = new Date().getFullYear();
  const emailContato = "procuroquemfaca@gmail.com";

  return (
    <footer className="w-full bg-white border-t border-slate-100 py-10 mt-auto">
      <div className="max-w-5xl mx-auto px-6 flex flex-col items-center gap-6">
        
        {/* Navegação Principal */}
        <nav className="flex flex-wrap justify-center gap-6 md:gap-8">
          <Link 
            href="/privacidade" 
            className="text-slate-400 hover:text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
          >
            Privacidade
          </Link>
          <Link 
            href="/termos" 
            className="text-slate-400 hover:text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
          >
            Termos
          </Link>
          
          {/* Fale Conosco via E-mail */}
          <a 
            href={`mailto:${emailContato}?subject=Contato via Portal Procuro Quem Faça`}
            className="text-blue-500 hover:text-blue-700 text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
            title={emailContato}
          >
            Fale Conosco
          </a>
        </nav>

        {/* Linha Divisória Sutil */}
        <div className="w-12 h-[1px] bg-slate-100"></div>

        {/* Créditos e Copyright */}
        <div className="text-center space-y-2">
          <p className="text-slate-500 text-xs font-medium">
            © {anoAtual} <span className="text-slate-900 font-black tracking-tight uppercase">Procuro Quem Faça</span>
          </p>
          <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">
            Desenvolvido por <span className="text-blue-600">CRR Nascimento</span>
          </p>
        </div>

      </div>
    </footer>
  )
}