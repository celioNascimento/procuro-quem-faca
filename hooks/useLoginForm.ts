// hooks/useLoginForm.ts 

import { useState, useEffect, useRef, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { garantirRoleInicial, getPrestadorResumo } from '@/lib/services/auth.service'
import { resolverDestinoPosLogin } from '@/lib/auth/resolverDestinoPosLogin'
import { insertLog } from '@/lib/db/logs'

// Esta tela de login é a "Área do Profissional" — qualquer conta criada
// implicitamente por aqui (e-mail/senha sem cadastro prévio) nasce como
// prestador. Se este hook um dia for reusado por uma tela de cliente,
// esse valor precisa deixar de ser fixo e virar parâmetro do hook.
const ROLE_PADRAO_DESTA_TELA = 'prestador'

export function useLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [mounted, setMounted] = useState(false)
  const isActive = useRef(true)  // ← useRef mantém o valor entre renders

  const router = useRouter()

  const handleBlur = (field: string) => setTouched(prev => ({ ...prev, [field]: true }))
  const emailInvalido = touched.email && (!email.includes('@') || email.length < 5)
  const senhaInvalida = touched.password && password.length < 6

  const registrarLogAuth = async (acao: string, detalhes: Record<string, any> = {}) => {
    try {
     await insertLog({
        acao,
        detalhes: { ...detalhes, email_tentativa: email },
        entidadeTipo: 'autenticacao',
      })
    } catch { }
  }

  const redirecionarUsuario = async (user: User) => {
    if (!isActive.current) return
    try {
      // garantirRoleInicial só grava se ainda não houver role — nunca
      // sobrescreve uma escolha existente. Cobre o caso residual de uma
      // conta criada sem role (ex: se confirmação de e-mail for ligada no
      // futuro, o signUp em handleLogin não chega a chamar
      // garantirRoleInicial antes do usuário sair da tela; quando ele
      // volta para logar de verdade, cai aqui). Hoje, com confirmação de
      // e-mail desligada, esse branch normalmente já encontra a role
      // gravada e só devolve o valor existente.
      const profile = await garantirRoleInicial(supabase, user.id, ROLE_PADRAO_DESTA_TELA)
      const prestador = await getPrestadorResumo(supabase, user.id)
      if (!isActive.current) return

      const destino = resolverDestinoPosLogin(profile, prestador)

      if (destino.startsWith('/cadastro') && typeof window !== 'undefined') {
        sessionStorage.setItem('pqf_prefill', JSON.stringify({ email, password }))
      }

      isActive.current = false
      router.push(destino)
    } catch {
      if (isActive.current) router.push('/cadastro')
    }
  }

  useEffect(() => {
    isActive.current = true
    setMounted(true)

    const params = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'))
    const isRecovery = params.get('type') === 'recovery' || hashParams.get('type') === 'recovery'

    if (isRecovery) {
      window.sessionStorage.setItem('recuperacao_em_curso', 'true')
      isActive.current = false
      router.replace(`/recuperar-senha${window.location.hash || window.location.search}`)
      return
    }

    // Verifica se já tem sessão ativa ao carregar a página
    // (ex: usuário volta para /login já logado)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isActive.current || !session) return
      if (window.sessionStorage.getItem('recuperacao_em_curso') === 'true') return
      redirecionarUsuario(session.user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isActive.current) return
      if (window.sessionStorage.getItem('recuperacao_em_curso') === 'true') return
      // Só reage ao SIGNED_IN vindo de fora (ex: OAuth)
      // Login por senha já é tratado diretamente no handleLogin
      if (event === 'SIGNED_IN' && session && !loading) {
        if (window.location.hash.includes('type=recovery')) return
        await redirecionarUsuario(session.user)
      }
    })

    return () => {
      isActive.current = false
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleEsqueciSenha() {
    if (!email || emailInvalido) { setMensagem('Erro: Digite um e-mail válido primeiro.'); return }
    setLoading(true)
    setMensagem('Verificando conta...')
    window.sessionStorage.setItem('recuperacao_em_curso', 'true')

    try {
      const { data: usuarioExiste, error: rpcError } = await supabase.rpc('verificar_usuario_existe', { email_busca: email })
      if (rpcError || !usuarioExiste) { setMensagem('Erro: Esta conta não foi encontrada.'); setLoading(false); return }

      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/recuperar-senha` })
      if (isActive.current) {
        if (error) throw error
        setMensagem('Sucesso: Link enviado! Verifique seu e-mail.')
        await registrarLogAuth('RECUPERACAO_SENHA_SOLICITADA')
      }
    } catch (err: any) {
       if (isActive.current) setMensagem('Erro: ' + (err.message || 'Falha ao processar.'))
    } finally {
      if (isActive.current) setLoading(false)
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
      if (!isActive.current) return

      if (!error && data?.session) {
        await registrarLogAuth('LOGIN_SUCESSO')
        await redirecionarUsuario(data.session.user)
        return
      }

      const credenciaisInvalidas = error?.status === 400 || error?.message?.toLowerCase().includes('invalid')
      if (!credenciaisInvalidas) {
        setMensagem('Erro: ' + (error?.message || 'Falha ao autenticar.'))
        return
      }

      // Credenciais inválidas: o Supabase não diferencia "conta não existe"
      // de "senha errada" no erro do signIn (por segurança, evita enumeração
      // de e-mails). Por isso tentamos criar a conta — se ela já existir,
      // o próprio signUp revela isso via `identities: []` na resposta,
      // sem gerar sessão nem sobrescrever a senha existente.
      const { data: novaConta, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (!isActive.current) return

      if (signUpError) {
        setMensagem('Erro: ' + signUpError.message)
        return
      }

      const contaJaExistia = (novaConta.user?.identities?.length ?? 0) === 0
      if (contaJaExistia) {
        setMensagem('Erro: E-mail ou senha incorretos.')
        return
      }

      if (!novaConta.session || !novaConta.user) {
        // Projeto com confirmação de e-mail obrigatória: conta foi criada,
        // mas ainda não há sessão para redirecionar automaticamente.
        // Não chamamos garantirRoleInicial aqui de propósito — a conta
        // ainda não tem sessão ativa e o RLS de `profiles` provavelmente
        // exige auth.uid() = id para o upsert funcionar. Quando esse
        // usuário confirmar o e-mail e voltar para logar de verdade,
        // redirecionarUsuario (acima) cobre esse caso residual.
        setMensagem('Sucesso: Conta criada! Verifique seu e-mail para confirmar o acesso.')
        return
      }

      await registrarLogAuth('CADASTRO_CRIADO_AUTOMATICO')
      const profileAtualizado = await garantirRoleInicial(supabase, novaConta.user.id, ROLE_PADRAO_DESTA_TELA)
      if (!isActive.current) return

      // Não usamos redirecionarUsuario aqui: ele releria o profile via
      // getStatusOnboarding numa request separada, sujeito ao mesmo atraso
      // de propagação que causava a queda em /auth/escolha. Como acabamos
      // de criar a conta, sabemos que não existe prestador vinculado ainda.
      const prestador = await getPrestadorResumo(supabase, novaConta.user.id)
      const destino = resolverDestinoPosLogin(profileAtualizado, prestador)

      if (destino.startsWith('/cadastro') && typeof window !== 'undefined') {
        sessionStorage.setItem('pqf_prefill', JSON.stringify({ email, password }))
      }

      isActive.current = false
      router.push(destino)
    } catch (err: any) {
      if (isActive.current && err.name !== 'AbortError') {
        setMensagem('Erro inesperado. Tente novamente.')
      }
    } finally {
      if (isActive.current) setLoading(false)
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