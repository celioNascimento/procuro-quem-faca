'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react'

// ── EyeIcon fora do componente — não recriado a cada render ──────────────────
function EyeIcon({ show, toggle }) {
  return (
    <button
      type="button"
      onClick={toggle}
      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-500 transition-colors p-1"
      tabIndex={-1}
    >
      {show ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
    </button>
  )
}

// ── Barra de força de senha ───────────────────────────────────────────────────
function ForcaSenha({ senha }) {
  if (!senha) return null

  const forca = senha.length < 6 ? 0 : senha.length < 10 ? 1 : /[A-Z]/.test(senha) && /[0-9]/.test(senha) ? 3 : 2
  const labels = ['', 'Fraca', 'Boa', 'Forte']
  const cores  = ['', 'bg-amber-400', 'bg-blue-400', 'bg-green-500']
  const textos = ['', 'text-amber-500', 'text-blue-500', 'text-green-600']

  return (
    <div className="flex items-center gap-2 px-1 mt-1">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3].map(n => (
          <div
            key={n}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${forca >= n ? cores[forca] : 'bg-slate-100'}`}
          />
        ))}
      </div>
      {forca > 0 && (
        <span className={`text-[9px] font-black uppercase tracking-wide ${textos[forca]}`}>
          {labels[forca]}
        </span>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function NovaSenha() {
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)

  // status separado em tipo + texto — sem emojis misturados à lógica
  const [status, setStatus] = useState({ tipo: '', texto: '' })
  const [loading, setLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [linkValido, setLinkValido] = useState(true)
  const [mounted, setMounted] = useState(false)

  const router = useRouter()
  const fluxoProcessado = useRef(false)

  const senhasPreenchidas = senha.length > 0 && confirmarSenha.length > 0
  const senhasIguais      = senhasPreenchidas && senha === confirmarSenha
  const senhaCurta        = senha.length > 0 && senha.length < 6
  const podeSubmeter      = senha.length >= 6 && senhasIguais && !loading

  useEffect(() => {
    setMounted(true)
    let isSubscribed = true

    const inicializarValidacao = async () => {
      const hash = window.location.hash
      const url  = window.location.href
      const temToken = hash.includes('access_token') || hash.includes('type=recovery')

      if (url.includes('error=access_denied')) {
        setLinkValido(false)
        setStatus({ tipo: 'erro', texto: 'Este link já foi usado ou expirou.' })
        setIsReady(true)
        return
      }

      if (temToken) setIsReady(true)

      const { data: { session } } = await supabase.auth.getSession()
      if (session && isSubscribed) {
        setIsReady(true)
        if (!fluxoProcessado.current) {
          registrarLogSeguranca('ACESSO_PAGINA_NOVA_SENHA', { email: session.user.email })
          fluxoProcessado.current = true
        }
      }

      setTimeout(() => {
        if (isSubscribed && !fluxoProcessado.current && !temToken && !session) {
          setLinkValido(false)
          setStatus({ tipo: 'erro', texto: 'Este link não é mais válido.' })
        }
        setIsReady(true)
      }, 2000)
    }

    inicializarValidacao()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session && isSubscribed) {
        setIsReady(true)
        fluxoProcessado.current = true
      }
    })

    return () => {
      isSubscribed = false
      subscription.unsubscribe()
    }
  }, [])

  const registrarLogSeguranca = async (acao, detalhes = {}) => {
    try {
      await supabase.from('logs_atividades').insert([{ acao, detalhes, entidade_tipo: 'recuperacao_senha' }])
    } catch { /* silencioso */ }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (senha.length < 6) {
      setStatus({ tipo: 'aviso', texto: 'Sua senha precisa ter pelo menos 6 caracteres.' })
      return
    }
    if (senha !== confirmarSenha) {
      setStatus({ tipo: 'aviso', texto: 'As senhas não coincidem. Tente novamente.' })
      return
    }

    setLoading(true)
    setStatus({ tipo: 'info', texto: 'Salvando sua nova senha...' })

    try {
      const { error } = await supabase.auth.updateUser({ password: senha })
      if (error) {
        setStatus({ tipo: 'erro', texto: 'Não foi possível atualizar. Tente novamente.' })
        setLoading(false)
      } else {
        setStatus({ tipo: 'sucesso', texto: 'Senha atualizada! Redirecionando...' })
        window.sessionStorage.removeItem('recuperacao_em_curso')
        window.sessionStorage.removeItem('bloquearRedirecionamento')
        window.history.replaceState({}, document.title, window.location.pathname)
        await supabase.auth.signOut()
        setTimeout(() => router.push('/login?msg=senha_alterada'), 1500)
      }
    } catch {
      setStatus({ tipo: 'erro', texto: 'Sem conexão. Verifique sua internet.' })
      setLoading(false)
    }
  }

  // ── Spinner de autenticação ─────────────────────────────────────────────────
  if (!mounted || !isReady) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center gap-5">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Verificando link...</p>
      </div>
    )
  }

  // ── Estilos de input ────────────────────────────────────────────────────────
  const inputBase = 'w-full p-5 pr-14 rounded-[1.5rem] border transition-all duration-200 outline-none font-medium text-sm text-slate-900 placeholder-slate-300 shadow-sm'
  const inputOk   = 'border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.08)]'
  const inputErr  = 'border-amber-200 bg-amber-50/30 focus:border-amber-400'

  // ── Estilos do banner de status ─────────────────────────────────────────────
  const statusEstilo = {
    erro:    'bg-red-50 text-red-600 border border-red-100',
    aviso:   'bg-amber-50 text-amber-600 border border-amber-100',
    sucesso: 'bg-green-50 text-green-600 border border-green-100',
    info:    'bg-blue-50 text-blue-600 border border-blue-100',
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans antialiased">
      <div className="w-full max-w-[400px] flex flex-col items-center gap-6">

        {/* ── Logo acima do card — tamanho correto para a nova proporção 5:1 ── */}
        <Link href="/" className="hover:opacity-80 active:scale-95 transition-all">
          <img src="/logo.png" alt="Procuro Quem Faça" className="h-12 w-auto object-contain" />
        </Link>

        {/* ── Card principal ── */}
        <div className="w-full bg-white p-8 md:p-10 rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)] border border-slate-100 text-center">

          {linkValido ? (
            <>
              {/* Ícone + títulos */}
              <div className="flex flex-col items-center gap-3 mb-8">
                <div className="w-14 h-14 bg-blue-50 rounded-[1.5rem] flex items-center justify-center">
                  <ShieldCheck size={26} className="text-blue-500" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Nova senha</h2>
                  <p className="text-slate-400 text-[11px] font-semibold mt-1">Escolha uma senha segura para sua conta</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">

                {/* Campo senha */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Nova Senha</label>
                    {senhaCurta && (
                      <span className="text-[9px] font-black text-amber-500 uppercase tracking-wide">
                        Mínimo 6 caracteres
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showSenha ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      required
                      value={senha}
                      onChange={e => setSenha(e.target.value)}
                      className={`${inputBase} ${senhaCurta ? inputErr : inputOk}`}
                    />
                    <EyeIcon show={showSenha} toggle={() => setShowSenha(v => !v)} />
                  </div>
                  {/* Barra de força */}
                  <ForcaSenha senha={senha} />
                </div>

                {/* Campo confirmar */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Confirmar Senha</label>
                    {senhasPreenchidas && (
                      <span className={`text-[9px] font-black uppercase tracking-wide ${senhasIguais ? 'text-green-500' : 'text-amber-500'}`}>
                        {senhasIguais ? 'Senhas iguais ✓' : 'Ainda diferentes'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showConfirmar ? 'text' : 'password'}
                      placeholder="Repita a senha"
                      required
                      value={confirmarSenha}
                      onChange={e => setConfirmarSenha(e.target.value)}
                      className={`${inputBase} ${senhasPreenchidas && !senhasIguais ? inputErr : inputOk}`}
                    />
                    <EyeIcon show={showConfirmar} toggle={() => setShowConfirmar(v => !v)} />
                  </div>
                </div>

                {/* Banner de status — animate-pulse só durante loading */}
                {status.texto && (
                  <div className={`p-4 rounded-2xl text-[11px] font-semibold text-center ${statusEstilo[status.tipo] || statusEstilo.info} ${loading ? 'animate-pulse' : ''}`}>
                    {status.texto}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!podeSubmeter}
                  className={`w-full py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all ${
                    podeSubmeter
                      ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-100'
                      : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Salvando...' : 'Confirmar nova senha'}
                </button>
              </form>
            </>
          ) : (
            /* ── Estado de link inválido ── */
            <div className="flex flex-col items-center gap-6 py-2">
              <div className="w-14 h-14 bg-red-50 rounded-[1.5rem] flex items-center justify-center">
                <AlertCircle size={26} className="text-red-400" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight mb-1">Link inválido</h2>
                <p className="text-slate-400 text-[12px] font-medium leading-relaxed">
                  {status.texto || 'Este link não é mais válido.'}<br />
                  Solicite um novo link de recuperação.
                </p>
              </div>
              <Link
                href="/login"
                className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all text-center block"
              >
                Solicitar novo link
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}