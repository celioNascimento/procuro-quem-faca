// hooks/admin/useEquipeAdmin.ts
'use client'

import { useCallback, useEffect, useState } from 'react'
import { emailValido, mensagemDoCodigoEquipe, normalizarEquipe, type EquipeAdmin } from '@/lib/admin/equipe'
import { adicionarAdmin, carregarEquipe, removerAdmin } from '@/lib/services/adminEquipe.service'

const VAZIA: EquipeAdmin = normalizarEquipe(null)

export function useEquipeAdmin() {
  const [equipe, setEquipe] = useState<EquipeAdmin>(VAZIA)
  const [carregando, setCarregando] = useState(true)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [email, setEmail] = useState('')

  const carregar = useCallback(async () => {
    try {
      setEquipe(await carregarEquipe())
      setErro(null)
    } catch (e) {
      console.error('[equipe] erro ao carregar', e)
      setErro('Não foi possível carregar a equipe. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { queueMicrotask(() => { void carregar() }) }, [carregar])

  const executar = useCallback(async (acao: () => Promise<{ codigo: string; mensagem?: string }>, sucesso: string): Promise<boolean> => {
    setOcupado(true); setErro(null); setAviso(null)
    try {
      const { codigo, mensagem } = await acao()
      if (codigo !== 'ok') { setErro(mensagem ?? mensagemDoCodigoEquipe(codigo)); return false }
      setAviso(sucesso)
      await carregar()
      return true
    } catch (e) {
      console.error('[equipe] erro', e)
      setErro('Não foi possível concluir. Tente de novo.')
      return false
    } finally {
      setOcupado(false)
    }
  }, [carregar])

  const adicionar = useCallback(async () => {
    if (!emailValido(email)) { setErro(mensagemDoCodigoEquipe('email_invalido')); setAviso(null); return }
    const enviado = email.trim()
    let convidado = false
    const ok = await executar(async () => {
      const r = await adicionarAdmin(enviado)
      convidado = r.convidado
      return r
    }, '')
    if (ok) {
      setAviso(convidado
        ? `Convite enviado para ${enviado}. Ela cria a senha pelo link do e-mail e, no primeiro acesso, cadastra o aplicativo autenticador.`
        : 'Pessoa adicionada à equipe. No próximo acesso, ela precisa cadastrar o aplicativo autenticador.')
      setEmail('')
    }
  }, [email, executar])

  const remover = useCallback(
    (userId: string) => executar(async () => ({ codigo: await removerAdmin(userId) }), 'Pessoa removida da equipe.'),
    [executar],
  )

  return { equipe, carregando, ocupado, erro, aviso, email, setEmail, adicionar, remover }
}
