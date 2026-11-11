//hooks/useMeusDados.ts

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { buscarMeusDados } from '@/lib/services/meusDados.service'
import { nomeArquivoExportacao, resumirExportacao, type ExportacaoDados } from '@/lib/meusDados/resumo'

export function useMeusDados() {
  const [dados, setDados] = useState<ExportacaoDados | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [precisaLogin, setPrecisaLogin] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let cancelado = false
    buscarMeusDados()
      .then(resultado => { if (!cancelado) setDados(resultado) })
      .catch(e => {
        if (cancelado) return
        if (e instanceof Error && e.message === 'LOGIN_NECESSARIO') setPrecisaLogin(true)
        else {
          console.error('[meus-dados] erro ao carregar', e)
          setErro('Não foi possível carregar seus dados agora. Tente novamente em instantes.')
        }
      })
      .finally(() => { if (!cancelado) setCarregando(false) })
    return () => { cancelado = true }
  }, [])

  const resumo = useMemo(() => (dados ? resumirExportacao(dados) : []), [dados])

  // O arquivo é montado no navegador com o que já foi carregado: nada é enviado de novo
  const baixar = useCallback(() => {
    if (!dados) return
    const arquivo = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(arquivo)
    const link = document.createElement('a')
    link.href = url
    link.download = nomeArquivoExportacao(new Date())
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }, [dados])

  return { dados, resumo, carregando, precisaLogin, erro, baixar }
}
