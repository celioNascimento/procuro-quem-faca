//hooks/useAvaliacao.ts

'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  fetchProjetoPorToken,
  reivindicarProjetoPorToken,
  type ResultadoReivindicacao,
  type ResultadoAvaliacao,
  fetchAvaliacaoPorProjeto,
  avaliarProjeto,
} from '@/lib/services/avaliacao.service'
import type { FotoOrdenada, Avaliacao, Projeto } from '@/types/avaliacao'

const MENSAGENS_ERRO_AVALIACAO: Record<Exclude<ResultadoAvaliacao, 'avaliado'> | 'erro_generico', string> = {
  nao_autenticado: 'Sua sessão expirou. Entre novamente para avaliar.',
  nao_encontrado: 'Não encontramos este projeto.',
  sem_vinculo: 'Este projeto ainda não está vinculado à sua conta. Abra o link do projeto de novo e tente outra vez.',
  nao_e_dono: 'Este serviço está associado a outra conta. Entre com a conta que abriu o link pela primeira vez.',
  projeto_nao_concluido: 'O prestador ainda não concluiu o serviço, então ele não pode ser avaliado agora.',
  ja_avaliado: 'Este serviço já foi avaliado.',
  nota_invalida: 'Escolha uma nota de 1 a 5.',
  erro_generico: 'Não foi possível enviar sua avaliação. Tente novamente.',
}

export function useAvaliar(token: string) {
  const router = useRouter()

  const [projeto, setProjeto] = useState<Projeto | null>(null)
  const [avaliacaoExistente, setAvaliacaoExistente] = useState<Avaliacao | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

  const [nota, setNota] = useState(0)
  const [hoverNota, setHoverNota] = useState(0)
  const [comentarioGeral, setComentarioGeral] = useState('')
  const [indica, setIndica] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [vinculo, setVinculo] = useState<ResultadoReivindicacao | null>(null)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  const avaliacaoFinalizada = avaliacaoExistente?.status === 'finalizado'

  const fotosCarrossel: FotoOrdenada[] =
    (projeto?.portfolio_fotos?.sort((a, b) => a.ordem - b.ordem) ?? []).map(f => ({
      ...f,
      label: f.ordem === 1 ? 'Antes' : f.ordem === 2 ? 'Durante' : 'Depois',
    }))

  useEffect(() => {
    queueMicrotask(() => setMounted(true))
  }, [])

  useEffect(() => {
    if (!token || !mounted) return

    async function carregar() {
      try {
        const projData = await fetchProjetoPorToken(token)
        if (!projData) { setLoading(false); return }

        setProjeto(projData)

        // Primeira conta logada que abre o link vira a dona do vínculo do projeto.
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) setVinculo(await reivindicarProjetoPorToken(token))

        const avalData = await fetchAvaliacaoPorProjeto(projData.id)
        if (avalData) setAvaliacaoExistente(avalData)

        const total = projData.portfolio_fotos?.length ?? 0
        if (total > 0) setCurrentSlide(total - 1)
      } catch (err) {
        console.error('Erro ao carregar projeto:', err)
      } finally {
        setLoading(false)
      }
    }

    queueMicrotask(() => carregar())
  }, [token, mounted])

  // Pré-seleciona indicação com base na nota
  useEffect(() => {
    if (nota >= 4) queueMicrotask(() => setIndica(true))
    else if (nota > 0 && nota <= 2) queueMicrotask(() => setIndica(false))
    else if (nota === 3) queueMicrotask(() => setIndica(null))
  }, [nota])

  const nextSlide = () =>
    setCurrentSlide(prev => (prev + 1) % fotosCarrossel.length)

  const prevSlide = () =>
    setCurrentSlide(prev => (prev - 1 + fotosCarrossel.length) % fotosCarrossel.length)

  const handleFinalizarAvaliacao = async () => {
    // Projeto vinculado a outra conta: só o dono do projeto avalia (o banco também exige).
    if (nota === 0 || submitting || avaliacaoFinalizada || vinculo === 'vinculado_outra_conta') return
    setSubmitting(true)
    setErroEnvio(null)
    try {
      const resultado = await avaliarProjeto({
        projetoId: projeto!.id,
        nota,
        comentario: comentarioGeral,
        indica: indica ?? false,
      })

      if (resultado === 'avaliado') {
        setProjeto(prev => prev ? { ...prev, status: 'finalizado' } : prev)
        router.push('/sucesso')
        return
      }

      if (resultado === 'nao_e_dono') setVinculo('vinculado_outra_conta')
      setErroEnvio(MENSAGENS_ERRO_AVALIACAO[resultado])
    } catch (err) {
      console.error(err)
      setErroEnvio(MENSAGENS_ERRO_AVALIACAO.erro_generico)
    } finally {
      setSubmitting(false)
    }
  }

  return {
    projeto, avaliacaoExistente, avaliacaoFinalizada,
    fotosCarrossel, currentSlide, nextSlide, prevSlide,
    loading, mounted,
    nota, setNota, hoverNota, setHoverNota,
    comentarioGeral, setComentarioGeral,
    indica, setIndica, submitting, vinculo, erroEnvio,
    handleFinalizarAvaliacao,
  }
}
