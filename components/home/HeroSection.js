'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase' // Importação necessária

export default function HeroSection({ onLog }) {
  const [mounted, setMounted] = useState(false)
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Use um requestAnimationFrame ou apenas mova para garantir o ciclo de vida
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {       // Verifica se há usuário logado
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })
  }, [])

  return (
    <header className={`w-full max-w-5xl px-6 py-6 flex justify-end absolute top-0 z-50 transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <Link
        href={session ? "/dashboard" : "/login"} // Redirecionamento dinâmico
        onClick={() => onLog('CLIQUE_SOU_PROFISSIONAL')}
        className="bg-white border border-slate-200 text-blue-600 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
      >
        Sou Profissional
      </Link>
    </header>
  )
}