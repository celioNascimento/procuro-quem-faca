// hooks/useAdminLogin.ts
//
// Estado e ações da tela de login do painel administrativo (a tela só desenha).
'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { enviarLinkDeNovaSenha, loginAdmin } from '@/lib/services/adminAuth.service'
import { emailParece, MSG_EMAIL_PARA_REDEFINIR, MSG_LINK_DE_REDEFINICAO_ENVIADO } from '@/lib/auth/adminLogin'

export function useAdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  async function entrar(evento: FormEvent) {
    evento.preventDefault()
    if (carregando) return
    setCarregando(true)
    setErro('')
    setAviso('')

    const falha = await loginAdmin(email, senha)
    if (falha) {
      setErro(falha)
      setCarregando(false)
      return
    }
    router.push('/admin')
    router.refresh()
  }

  async function esqueciMinhaSenha() {
    if (carregando) return
    setErro('')
    setAviso('')
    if (!emailParece(email)) {
      setErro(MSG_EMAIL_PARA_REDEFINIR)
      return
    }

    setCarregando(true)
    const falha = await enviarLinkDeNovaSenha(email, window.location.origin)
    setCarregando(false)
    if (falha) setErro(falha)
    else setAviso(MSG_LINK_DE_REDEFINICAO_ENVIADO)
  }

  return {
    email, setEmail,
    senha, setSenha,
    mostrarSenha, alternarSenha: () => setMostrarSenha((v) => !v),
    carregando, erro, aviso,
    entrar, esqueciMinhaSenha,
  }
}
