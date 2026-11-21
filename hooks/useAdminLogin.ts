// hooks/useAdminLogin.ts
//
// Estado e ações da tela de login do painel administrativo (a tela só desenha).
// Duas etapas: 1) e-mail e senha; 2) código do aplicativo autenticador, quando a conta tem um cadastrado.
'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { enviarLinkDeNovaSenha, loginAdmin, sairDaConta } from '@/lib/services/adminAuth.service'
import { confirmarCodigo, fatorConfirmado, nivelDeAcesso } from '@/lib/services/adminMfa.service'
import { emailParece, MSG_EMAIL_PARA_REDEFINIR, MSG_FALHA_AO_ENTRAR, MSG_LINK_DE_REDEFINICAO_ENVIADO } from '@/lib/auth/adminLogin'
import { MSG_CODIGO_FORMATO, normalizarCodigo, precisaDoCodigo } from '@/lib/auth/adminMfa'

export type EtapaLogin = 'senha' | 'codigo'

export function useAdminLogin() {
  const router = useRouter()
  const [etapa, setEtapa] = useState<EtapaLogin>('senha')
  const [fatorId, setFatorId] = useState<string | null>(null)
  const [codigo, setCodigo] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  function abrirPainel() {
    router.push('/admin')
    router.refresh()
  }

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

    try {
      if (precisaDoCodigo(await nivelDeAcesso())) {
        const id = await fatorConfirmado()
        if (id) {
          setFatorId(id)
          setEtapa('codigo')
          setCarregando(false)
          return
        }
      }
    } catch {
      // Sem conseguir saber se há segundo fator, não deixa entrar: sai da conta e pede para tentar de novo.
      await sairDaConta()
      setErro(MSG_FALHA_AO_ENTRAR)
      setCarregando(false)
      return
    }
    abrirPainel()
  }

  async function verificarCodigo(evento: FormEvent) {
    evento.preventDefault()
    if (carregando || !fatorId) return
    const numeros = normalizarCodigo(codigo)
    if (!numeros) { setErro(MSG_CODIGO_FORMATO); return }
    setCarregando(true)
    setErro('')
    const falha = await confirmarCodigo(fatorId, numeros)
    if (falha) {
      setErro(falha)
      setCarregando(false)
      return
    }
    abrirPainel()
  }

  async function voltarParaSenha() {
    await sairDaConta()
    setEtapa('senha')
    setFatorId(null)
    setCodigo('')
    setSenha('')
    setErro('')
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
    etapa, codigo, setCodigo, verificarCodigo, voltarParaSenha,
    email, setEmail,
    senha, setSenha,
    mostrarSenha, alternarSenha: () => setMostrarSenha((v) => !v),
    carregando, erro, aviso,
    entrar, esqueciMinhaSenha,
  }
}
