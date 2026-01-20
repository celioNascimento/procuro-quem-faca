import Link from 'next/link'

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* CABEÇALHO EXCLUSIVO DO ADMIN */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* LOGO ADMIN */}
          <Link href="/admin" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg group-hover:bg-blue-600 transition-all">
              <span className="text-white font-black text-xl italic">A</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-slate-900 font-black text-lg uppercase tracking-tighter">Painel Gestão</span>
              <span className="text-blue-500 font-bold text-[10px] uppercase tracking-[0.2em]">Ambiente Restrito</span>
            </div>
          </Link>

          {/* LINKS INTERNOS */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/admin/geografia" className="text-[10px] font-black uppercase text-slate-500 hover:text-slate-900 tracking-widest">Geografia</Link>
            <Link href="/admin/habilidades" className="text-[10px] font-black uppercase text-slate-500 hover:text-slate-900 tracking-widest">Habilidades</Link>
            <Link href="/admin/anuncios" className="text-[10px] font-black uppercase text-slate-500 hover:text-slate-900 tracking-widest">Anúncios</Link>
          </div>

          {/* PERFIL ADMIN */}
          <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-slate-900 uppercase">Admin Londrina</p>
              <p className="text-[9px] font-medium text-slate-400">owner@site.com</p>
            </div>
            <div className="w-10 h-10 bg-slate-200 rounded-full border-2 border-white shadow-sm" />
          </div>

        </div>
      </nav>

      {/* ÁREA DE CONTEÚDO */}
      <main className="py-8">
        {children}
      </main>
    </div>
  )
}