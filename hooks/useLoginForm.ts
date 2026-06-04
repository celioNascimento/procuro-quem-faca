import { useState, useEffect, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export function useLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [mounted, setMounted] = useState(false)

  const router = useRouter()
  let isComponentActive = true

  const handleBlur = (field: string) => setTouched(prev => ({ ...prev, [field]: true }))
  const emailInvalido = touched.email && (!email.includes('@') || email.length < 5)
  const senhaInvalida = touched.password && password.length < 6

  const registrarLogAuth = async (acao: string, detalhes: Record<string, any> = {}) => {
    try {
      await supabase.from('logs_atividades').insert({
        acao,
        detalhes: { ...detalhes, email_tentativa: email },
        entidade_tipo: 'autenticacao'
      })
    } catch { }
  }

  const redirecionarUsuario = async (user: User) => {
    if (!isComponentActive) return
    try {
      const { data: perfil } = await supabase
        .from('prestadores')
        .select('id, user_id, origem_tipo, categoria_id')
        .or(`user_id.eq.${user.id},whatsapp.ilike.%${user.email}%`)
        .maybeSingle()

      if (!isComponentActive) return

      const path = (!perfil || perfil.origem_tipo === 'curadoria_publica' || !perfil.categoria_id)
        ? `/cadastro${perfil?.origem_tipo === 'curadoria_publica' ? `?reivindicar=${perfil.id}` : ''}`
        : '/dashboard'

      isComponentActive = false
      router.push(path)
    } catch {
      if (isComponentActive) router.push('/cadastro')
    }
  }

  useEffect(() => {
    setMounted(true)
    isComponentActive = true
    const params = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'))
    const isRecovery = params.get('type') === 'recovery' || hashParams.get('type') === 'recovery'

    if (isRecovery) {
      window.sessionStorage.setItem('recuperacao_em_curso', 'true')
      isComponentActive = false
      router.replace(`/recuperar-senha${window.location.hash || window.location.search}`)
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isComponentActive) return
      if (window.sessionStorage.getItem('recuperacao_em_curso') === 'true') return
      if (event === 'SIGNED_IN' && session) {
        if (window.location.hash.includes('type=recovery')) return
        await redirecionarUsuario(session.user)
      }
    })

    return () => { isComponentActive = false; subscription.unsubscribe() }
  }, [router])

  async function handleEsqueciSenha() {
    if (!email || emailInvalido) { setMensagem('Erro: Digite um e-mail válido primeiro.'); return }
    setLoading(true)
    setMensagem('Verificando conta...')
    window.sessionStorage.setItem('recuperacao_em_curso', 'true')

    try {
      const { data: usuarioExiste, error: rpcError } = await supabase.rpc('verificar_usuario_existe', { email_busca: email })
      if (rpcError || !usuarioExiste) { setMensagem('Erro: Esta conta não foi encontrada.'); setLoading(false); return }

      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/recuperar-senha` })
      if (isComponentActive) {
        if (error) throw error
        setMensagem('Sucesso: Link enviado! Verifique seu e-mail.')
        await registrarLogAuth('RECUPERACAO_SENHA_SOLICITADA')
      }
    } catch (err: any) {
      if (isComponentActive) setMensagem('Erro: ' + (err.message || 'Falha ao processar.'))
    } finally {
      if (isComponentActive) setLoading(false)
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setMensagem('')
    window.sessionStorage.removeItem('recuperacao_em_curso')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (!isComponentActive) return

      if (error) {
        if (error.status === 400 || error.message.toLowerCase().includes('invalid')) {
          setMensagem('Erro: E-mail ou senha incorretos.')
        } else {
          setMensagem('Erro: ' + error.message)
        }
        return
      }

      if (data?.session) {
        await registrarLogAuth('LOGIN_SUCESSO')
        await redirecionarUsuario(data.session.user)
      }
    } catch (err: any) {
      if (isComponentActive && err.name !== 'AbortError') {
        setMensagem('Erro inesperado. Tente novamente.')
      }
    } finally {
      if (isComponentActive) setLoading(false)
    }
  }

  return {
    email, setEmail,
    password, setPassword,
    showPassword, setShowPassword,
    loading,
    mensagem,
    touched,
    mounted,
    emailInvalido,
    senhaInvalida,
    handleBlur,
    handleEsqueciSenha,
    handleLogin,
    registrarLogAuth
  }
}