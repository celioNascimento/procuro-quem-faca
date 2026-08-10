//hooks/useAdminAnuncios.ts

import { useState, useEffect, useCallback } from 'react'
import {
  listarAnuncios,
  criarAnuncio,
  atualizarAnuncio,
  alternarStatusAnuncio,
  excluirAnuncio,
  criarOuBuscarAnunciante,
  uploadBannerAnuncio,
  type AnuncioComAnunciante,
  type NovoAnuncioInput,
} from '@/lib/services/adminAnuncios.service'

export function useAdminAnuncios() {
  const [anuncios, setAnuncios] = useState<AnuncioComAnunciante[]>([])
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false) // separado de loading — mesma lição do CadastroSkeleton (ver memória)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const data = await listarAnuncios()
      setAnuncios(data)
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao carregar anúncios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  /**
   * Fluxo completo de cadastro: garante o anunciante (cria conta Auth se
   * necessário) -> sobe a imagem se for arquivo -> cria o anuncio.
   * Retorna a senha temporária (se um usuário novo foi criado) pra exibir 1x.
   */
  const cadastrarNovoAnuncio = useCallback(
    async (params: {
      lojista: { email: string; razaoSocial: string; cnpjCpf?: string; whatsapp?: string }
      anuncio: Omit<NovoAnuncioInput, 'anuncianteId'>
      imagemFile?: File | null
    }) => {
      setEnviando(true)
      setErro(null)
      try {
        const { anunciante, senhaTemporaria } = await criarOuBuscarAnunciante(params.lojista)

        let imagemUrl = params.anuncio.imagemUrl
        if (params.imagemFile) {
          imagemUrl = await uploadBannerAnuncio(params.imagemFile, anunciante.id)
        }

        const novo = await criarAnuncio({
          ...params.anuncio,
          imagemUrl,
          anuncianteId: anunciante.id,
        })

        await carregar()
        return { anuncio: novo, senhaTemporaria }
      } catch (e: any) {
        setErro(e.message ?? 'Erro ao cadastrar anúncio')
        throw e
      } finally {
        setEnviando(false)
      }
    },
    [carregar]
  )

  const editarAnuncio = useCallback(
    async (id: string, dados: Partial<NovoAnuncioInput>, imagemFile?: File | null, anuncianteId?: string) => {
      setEnviando(true)
      setErro(null)
      try {
        let imagemUrl = dados.imagemUrl
        if (imagemFile && anuncianteId) {
          imagemUrl = await uploadBannerAnuncio(imagemFile, anuncianteId)
        }
        await atualizarAnuncio(id, { ...dados, imagemUrl })
        await carregar()
      } catch (e: any) {
        setErro(e.message ?? 'Erro ao editar anúncio')
        throw e
      } finally {
        setEnviando(false)
      }
    },
    [carregar]
  )

  const toggleAtivo = useCallback(
    async (id: string, ativo: boolean) => {
      // Atualização otimista — evita esperar round-trip pra sentir o toggle responder
      setAnuncios((prev) => prev.map((a) => (a.id === id ? { ...a, status: ativo } : a)))
      try {
        await alternarStatusAnuncio(id, ativo)
      } catch (e: any) {
        setErro(e.message ?? 'Erro ao atualizar visibilidade')
        await carregar() // reverte pro estado real do banco em caso de falha
      }
    },
    [carregar]
  )

  const remover = useCallback(
    async (id: string) => {
      setEnviando(true)
      try {
        await excluirAnuncio(id)
        setAnuncios((prev) => prev.filter((a) => a.id !== id))
      } catch (e: any) {
        setErro(e.message ?? 'Erro ao excluir anúncio')
        throw e
      } finally {
        setEnviando(false)
      }
    },
    []
  )

  return {
    anuncios,
    loading,
    enviando,
    erro,
    cadastrarNovoAnuncio,
    editarAnuncio,
    toggleAtivo,
    remover,
    recarregar: carregar,
  }
}
