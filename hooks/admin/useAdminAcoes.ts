// hooks/admin/useAdminAcoes.ts
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { filtrarAcoes, pessoasDoRegistro, type AcaoAdmin, type GrupoDeAcao } from '@/lib/admin/acoes'
import { LIMITE_ACOES, listarAcoesAdmin } from '@/lib/services/adminAcoes.service'

export function useAdminAcoes() {
  const [acoes, setAcoes] = useState<AcaoAdmin[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [grupo, setGrupo] = useState<GrupoDeAcao | 'todos'>('todos')
  const [quem, setQuem] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      setAcoes(await listarAcoesAdmin())
    } catch (e) {
      console.error('[historico] erro ao carregar', e)
      setErro('Não foi possível carregar o histórico. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { queueMicrotask(() => { void carregar() }) }, [carregar])

  const visiveis = useMemo(() => filtrarAcoes(acoes, { grupo, quem }), [acoes, grupo, quem])
  const pessoas = useMemo(() => pessoasDoRegistro(acoes), [acoes])

  return { acoes, visiveis, pessoas, carregando, erro, grupo, setGrupo, quem, setQuem, carregar, truncado: acoes.length >= LIMITE_ACOES }
}
