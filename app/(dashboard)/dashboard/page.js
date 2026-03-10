'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import EditarPerfilTab from '@/components/dashboard/EditarPerfilTab'
import PortfolioDashboardTab from '@/components/dashboard/PortfolioDashboardTab'
import { Lock, UserCircle2, Images, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function PerfilPage() {
  // Abre direto em portfólio — é o que o prestador quer ver primeiro
  const [abaAtiva, setAbaAtiva] = useState('portfolio')
  const [cadastroCompleto, setCadastroCompleto] = useState(false)
  const [validando, setValidando] = useState(true)
  const [slug, setSlug] = useState(null)

  useEffect(() => {
    async function verificarPerfil() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const userId = session?.user?.id
        if (!userId) { setValidando(false); return }

        const { data: prestador } = await supabase
          .from('prestadores')
          .select('nome, whatsapp, categoria_id, status, slug')
          .eq('user_id', userId)
          .maybeSingle()

        const completo = !!(
          prestador?.nome?.trim() &&
          prestador?.whatsapp &&
          prestador?.categoria_id &&
          prestador?.status === 'ativo'
        )
        setCadastroCompleto(completo)
        setSlug(prestador?.slug || null)

        // Cadastro incompleto → cai direto em Dados Profissionais
        if (!completo) setAbaAtiva('perfil')
      } catch {
        setCadastroCompleto(false)
      } finally {
        setValidando(false)
      }
    }
    verificarPerfil()
  }, [])

  // ── 3 abas: Portfólio → Ver Perfil (link externo) → Dados Profissionais ──
  const abas = [
    {
      id: 'portfolio',
      label: 'Meus Projetos',
      icon: <Images size={14} />,
      bloqueado: !cadastroCompleto,
      externo: false,
    },
    {
      id: 'perfil',
      label: 'Dados Profissionais',
      icon: <UserCircle2 size={14} />,
      bloqueado: false,
      externo: false,
    },
  ]

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <main className="max-w-5xl mx-auto pb-8 pt-0">

        {/* ── Seletor de abas ── */}
        <div className="px-5 md:px-8 py-3 border-b border-slate-100 bg-white sticky top-0 z-40 overflow-hidden">
          <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1" style={{scrollbarWidth:'none',msOverflowStyle:'none'}}>

            {abas.map(aba => (
              <button
                key={aba.id}
                disabled={aba.bloqueado || validando}
                onClick={() => setAbaAtiva(aba.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap ${
                  abaAtiva === aba.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                    : aba.bloqueado
                      ? 'text-slate-300 cursor-not-allowed opacity-60'
                      : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {aba.bloqueado && !validando ? <Lock size={11} /> : aba.icon}
                {aba.label}
                {aba.bloqueado && !validando && (
                  <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    Complete o perfil
                  </span>
                )}
              </button>
            ))}

            {/* Botão "Ver meu perfil" — link externo, mesmo nível das abas */}
            {slug && !validando && (
              <Link
                href={`/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap text-slate-500 hover:bg-slate-100 border border-slate-200 hover:border-blue-200 hover:text-blue-600"
              >
                <ExternalLink size={12} />
                Ver meu perfil
              </Link>
            )}

          </div>
        </div>

        {/* ── Conteúdo ── */}
        <div className="animate-in fade-in duration-300 pt-4">
          {validando ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-[3px] border-slate-100 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Verificando...</p>
            </div>
          ) : (
            abaAtiva === 'perfil' ? <EditarPerfilTab /> : <PortfolioDashboardTab />
          )}
        </div>
      </main>
    </div>
  )
}