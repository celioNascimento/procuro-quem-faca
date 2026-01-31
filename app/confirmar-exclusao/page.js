'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'

export default function ConfirmarExclusao() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmado, setConfirmado] = useState(false)
  const [sessionInfo, setSessionInfo] = useState({ id: null, email: null })
  const [motivo, setMotivo] = useState('')

  useEffect(() => {
    async function checarSessao() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setSessionInfo({
          id: session.user.id,
          email: session.user.email
        })
      }
    }
    checarSessao()
  }, [router])

  async function executarExclusao() {
    if (!confirmado || !sessionInfo.id) return
    setLoading(true)

    try {
      // 1. REGISTRAR LOG (Seguindo seu Schema SQL)
      await supabase.from('logs_atividades').insert({
        usuario_id: sessionInfo.id,
        usuario_email: sessionInfo.email,
        acao: 'EXCLUSAO_CONTA_VOLUNTARIA',
        entidade_tipo: 'perfil_prestador',
        detalhes: { 
          motivo: motivo || 'Não informado',
          agente: navigator.userAgent,
          plataforma: navigator.platform
        }
      })

      // 2. Buscar dados do prestador para limpar fotos
      const { data: perfil } = await supabase
        .from('prestadores')
        .select('foto_perfil')
        .eq('user_id', sessionInfo.id)
        .single()

      // 3. Remover do Storage
      if (perfil?.foto_perfil) {
        const fileName = perfil.foto_perfil.split('/').pop()
        await supabase.storage.from('fotos-perfil').remove([fileName])
      }

      // 4. Deletar registro do banco
      const { error: dbError } = await supabase
        .from('prestadores')
        .delete()
        .eq('user_id', sessionInfo.id)

      if (dbError) throw dbError

      // 5. Encerrar Sessão e Redirecionar
      await supabase.auth.signOut()
      window.location.href = '/login?status=conta-excluida'

    } catch (error) {
      console.error('Erro no processo:', error)
      alert('Erro ao processar exclusão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white font-sans">
      <Header href="/cadastro" />

      <div className="max-w-xl mx-auto pt-32 md:pt-40 px-6 text-center pb-20">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>

        <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">
          Confirmar Exclusão
        </h1>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-10">
          Ação permanente e irreversível
        </p>

        {/* Motivo para o Log */}
        <div className="text-left space-y-3 mb-8">
          <label className="text-slate-400 font-black text-[9px] uppercase tracking-widest ml-4">
            Por que você está saindo? (Log de Qualidade)
          </label>
          <textarea 
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex: Não encontrei clientes, o app é difícil de usar..."
            className="w-full p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 outline-none focus:border-red-200 text-sm text-slate-700 resize-none h-28 transition-all font-medium"
          />
        </div>

        <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] mb-10">
          <label className="flex items-center gap-4 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={confirmado} 
              onChange={(e) => setConfirmado(e.target.checked)}
              className="w-6 h-6 rounded-lg border-slate-200 text-red-600 focus:ring-red-600 focus:ring-offset-0"
            />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-left leading-tight">
              Entendo que meus dados serão apagados para sempre.
            </span>
          </label>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={executarExclusao}
            disabled={!confirmado || loading}
            className={`w-full py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] transition-all ${
              confirmado && !loading 
              ? 'bg-red-600 text-white shadow-xl shadow-red-100 hover:bg-red-700 active:scale-95' 
              : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
            }`}
          >
            {loading ? 'APAGANDO...' : 'CONFIRMAR EXCLUSÃO'}
          </button>

          <Link 
            href="/cadastro" 
            className="text-slate-400 font-black text-[9px] uppercase tracking-widest hover:text-slate-600 transition-colors py-4 italic"
          >
            Voltar para o Perfil
          </Link>
        </div>
      </div>
    </main>
  )
}