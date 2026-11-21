'use client'

import { useCallback, useEffect, useState } from 'react'
import { confirmarCodigo, fatorConfirmado, iniciarCadastro, removerFator, type CadastroDoFator } from '@/lib/services/adminMfa.service'
import { MSG_CODIGO_FORMATO, MSG_FALHA_NA_VERIFICACAO, normalizarCodigo } from '@/lib/auth/adminMfa'

export type EstadoSeguranca = 'carregando' | 'desligada' | 'cadastrando' | 'ligada'

export function useSegurancaConta() {
  const [estado, setEstado] = useState<EstadoSeguranca>('carregando')
  const [fatorId, setFatorId] = useState<string | null>(null)
  const [cadastro, setCadastro] = useState<CadastroDoFator | null>(null)
  const [codigo, setCodigo] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    try {
      const id = await fatorConfirmado()
      setFatorId(id)
      setEstado(id ? 'ligada' : 'desligada')
    } catch (e) {
      console.error('[admin/seguranca] erro ao carregar', e)
      setErro(MSG_FALHA_NA_VERIFICACAO)
      setEstado('desligada')
    }
  }, [])

  useEffect(() => { queueMicrotask(() => void carregar()) }, [carregar])

  async function comecar() {
    if (ocupado) return
    setOcupado(true)
    setErro('')
    try {
      setCadastro(await iniciarCadastro())
      setEstado('cadastrando')
    } catch (e) {
      console.error('[admin/seguranca] erro ao iniciar', e)
      setErro(e instanceof Error && e.message ? e.message : MSG_FALHA_NA_VERIFICACAO)
    } finally {
      setOcupado(false)
    }
  }

  async function confirmar() {
    if (ocupado || !cadastro) return
    const numeros = normalizarCodigo(codigo)
    if (!numeros) { setErro(MSG_CODIGO_FORMATO); return }
    setOcupado(true)
    setErro('')
    const falha = await confirmarCodigo(cadastro.factorId, numeros)
    setOcupado(false)
    if (falha) { setErro(falha); return }
    setCadastro(null)
    setCodigo('')
    await carregar()
  }

  async function cancelar() {
    if (cadastro) await removerFator(cadastro.factorId)
    setCadastro(null)
    setCodigo('')
    setErro('')
    setEstado('desligada')
  }

  async function desativar() {
    if (ocupado || !fatorId) return
    setOcupado(true)
    setErro('')
    const ok = await removerFator(fatorId)
    setOcupado(false)
    if (!ok) { setErro(MSG_FALHA_NA_VERIFICACAO); return }
    await carregar()
  }

  return { estado, cadastro, codigo, setCodigo, ocupado, erro, comecar, confirmar, cancelar, desativar }
}
