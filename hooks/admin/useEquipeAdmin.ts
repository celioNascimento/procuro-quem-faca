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

  const executar = useCallback(async (acao: () => Promise<string>, sucesso: string): Promise<boolean> => {
    setOcupado(true); setErro(null); setAviso(null)
    try {
      const codigo = await acao()
      if (codigo !== 'ok') { setErro(mensagemDoCodigoEquipe(codigo)); return false }
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
    if (await executar(() => adicionarAdmin(email.trim()), 'Pessoa adicionada à equipe. Peça para ela ligar a verificação em duas etapas.')) setEmail('')
  }, [email, executar])

  const remover = useCallback((userId: string) => executar(() => removerAdmin(userId), 'Pessoa removida da equipe.'), [executar])

  return { equipe, carregando, ocupado, erro, aviso, email, setEmail, adicionar, remover }
}
