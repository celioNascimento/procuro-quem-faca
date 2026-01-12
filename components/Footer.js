import Link from 'next/link'

export default function Footer() {
  const anoAtual = new Date().getFullYear();

  return (
    <footer className="w-full bg-white border-t border-slate-100 py-10 mt-auto">
      <div className="max-w-5xl mx-auto px-6 flex flex-col items-center gap-6">
        
        {/* Navegação de Políticas */}
        <nav className="flex gap-8">
          <Link 
            href="/privacidade" 
            className="text-slate-400 hover:text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
          >
            Política de Privacidade
          </Link>
          <Link 
            href="/termos" 
            className="text-slate-400 hover:text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
          >
            Termos de Uso
          </Link>
        </nav>

        {/* Linha Divisória Sutil */}
        <div className="w-12 h-[1px] bg-slate-100"></div>

        {/* Créditos e Copyright */}
        <div className="text-center space-y-2">
          <p className="text-slate-500 text-xs font-medium">
            © {anoAtual} <span className="text-slate-900 font-black tracking-tight">Procuro Quem Faça - Portal de Prestadores</span>
          </p>
          <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">
            Desenvolvido por <span className="text-blue-600">CRR Nascimento</span>
          </p>
        </div>

      </div>
    </footer>
  )
}