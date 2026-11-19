// hooks/useDocumentoVerificacao.ts — estado da aba Seguro / CND.
'use client'

import { useCallback, useEffect, useState } from 'react'
import { buscarMeuDocumento, enviarDocumento } from '@/lib/services/documentosVerificacao.service'
import {
  faseDoDocumento, validarArquivo, validarSeguro, type DadosSeguro, type FaseDocumento, type TipoDocumento,
  type VerificacaoDocumento,
} from '@/lib/selos/documentos'

export interface DocumentoVerificacao {
  verificacao: VerificacaoDocumento | null
  fase: FaseDocumento
  carregando: boolean
  enviando: boolean
  erro: string | null
  aviso: string | null
  enviar: (arquivo: File | null, seguro?: DadosSeguro) => Promise<void>
}

export function useDocumentoVerificacao(prestadorId: number | null, tipo: TipoDocumento): DocumentoVerificacao {
  const [verificacao, setVerificacao] = useState<VerificacaoDocumento | null>(null)
  const [carregando, setCarregando] = useState(prestadorId !== null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    if (prestadorId === null) return
    try {
      setVerificacao(await buscarMeuDocumento(prestadorId, tipo))
    } catch (e) {
      console.error('Erro ao carregar documento de verificação:', e)
      setErro('Não foi possível carregar agora. Atualize a página.')
    } finally {
      setCarregando(false)
    }
  }, [prestadorId, tipo])

  useEffect(() => { queueMicrotask(() => carregar()) }, [carregar])

  const enviar = useCallback(async (arquivo: File | null, seguro?: DadosSeguro) => {
    setErro(null)
    setAviso(null)
    if (!arquivo) return setErro('Escolha o arquivo do comprovante.')
    const problemaArquivo = validarArquivo(arquivo)
    if (problemaArquivo) return setErro(problemaArquivo)
    if (tipo === 'seguro') {
      const problema = seguro ? validarSeguro(seguro) : 'Preencha os dados da apólice.'
      if (problema) return setErro(problema)
    }
    setEnviando(true)
    try {
      await enviarDocumento(tipo, arquivo, seguro)
      setAviso('Recebemos! Nossa equipe vai conferir e você será avisado aqui no painel.')
      await carregar()
    } catch (e) {
      console.error('Erro ao enviar comprovante:', e)
      setErro('Não conseguimos enviar agora. Confira o arquivo e tente de novo.')
    } finally {
      setEnviando(false)
    }
  }, [tipo, carregar])

  return { verificacao, fase: faseDoDocumento(verificacao), carregando, enviando, erro, aviso, enviar }
}
