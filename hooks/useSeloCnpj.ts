// hooks/useSeloCnpj.ts
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { buscarCnaesCompativeis, buscarMeuSeloCnpj, enviarCnpj, removerCnpj } from '@/lib/services/seloCnpj.service'
import { cnpjValido, mascararCnpj, normalizarCnpj } from '@/lib/cnpj/validacao'
import { faseDoSeloCnpj, type DadosSeloCnpj, type FaseSeloCnpj } from '@/lib/selos/cnpjEstado'

export interface SeloCnpj {
  dados: DadosSeloCnpj
  /** Códigos de CNAE do CNPJ que combinam com a categoria do perfil. */
  cnaesCompativeis: string[]
  fase: FaseSeloCnpj
  carregando: boolean
  enviando: boolean
  removendo: boolean
  digitado: string
  erro: string | null
  aviso: string | null
  digitar: (valor: string) => void
  enviar: () => Promise<void>
  remover: () => Promise<void>
}

const VAZIO: DadosSeloCnpj = { verificacao: null, cnpj: null }

export function useSeloCnpj(prestadorId: number | null): SeloCnpj {
  const [dados, setDados] = useState<DadosSeloCnpj>(VAZIO)
  const [cnaesCompativeis, setCnaesCompativeis] = useState<string[]>([])
  const [carregando, setCarregando] = useState(prestadorId !== null)
  const [enviando, setEnviando] = useState(false)
  const [removendo, setRemovendo] = useState(false)
  const [digitado, setDigitado] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    if (prestadorId === null) return
    try {
      const novos = await buscarMeuSeloCnpj(prestadorId)
      setDados(novos)
      setCnaesCompativeis(novos.cnpj ? await buscarCnaesCompativeis(prestadorId) : [])
    } catch (err) {
      console.error('Erro ao carregar o selo de CNPJ:', err)
      setErro('Não foi possível carregar o seu CNPJ agora. Atualize a página.')
    } finally {
      setCarregando(false)
    }
  }, [prestadorId])

  useEffect(() => {
    queueMicrotask(() => carregar())
  }, [carregar])

  const digitar = useCallback((valor: string) => {
    setDigitado(mascararCnpj(valor))
    setErro(null)
  }, [])

  const enviar = useCallback(async () => {
    setAviso(null)
    if (!cnpjValido(digitado)) {
      setErro('Confira o número: ele precisa ter 14 caracteres e dígitos finais corretos.')
      return
    }
    setEnviando(true)
    setErro(null)
    const resultado = await enviarCnpj(normalizarCnpj(digitado))
    if (resultado.ok) {
      setAviso(resultado.mensagem)
      setDigitado('')
      await carregar()
    } else {
      setErro(resultado.erro)
    }
    setEnviando(false)
  }, [digitado, carregar])

  const remover = useCallback(async () => {
    setRemovendo(true)
    setErro(null)
    setAviso(null)
    const resultado = await removerCnpj()
    if (resultado.ok) {
      setAviso('CNPJ removido. Você pode informar outro quando quiser.')
      await carregar()
    } else {
      setErro(resultado.erro)
    }
    setRemovendo(false)
  }, [carregar])

  const fase = useMemo(() => faseDoSeloCnpj(dados), [dados])

  return { dados, cnaesCompativeis, fase, carregando, enviando, removendo, digitado, erro, aviso, digitar, enviar, remover }
}
