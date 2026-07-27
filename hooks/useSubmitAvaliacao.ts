//hooks/useSubmitAvaliacao.ts

'use client'
import { useState } from 'react'
import { uploadImagemPortfolio } from '@/lib/services/uploadWizard.service'
import { inserirAvaliacao, finalizarProjeto, marcarProjetoEmDisputa } from '@/lib/services/avaliacao.service'

type Status = 'idle' | 'uploading' | 'saving' | 'done' | 'error'

interface SubmitPayload {
  projetoId: string
  prestadorId: number
  clienteId: string
  nota: number
  comentario: string
  isContestacao: boolean
  fotosEvidencia: File[]
}

export function useSubmitAvaliacao(onComplete: () => void) {
  const [status, setStatus] = useState<Status>('idle')
  const [erro, setErro] = useState<string | null>(null)

  async function submit({
    projetoId,
    prestadorId,
    clienteId,
    nota,
    comentario,
    isContestacao,
    fotosEvidencia,
  }: SubmitPayload) {
    if (status === 'uploading' || status === 'saving') return
    setErro(null)

    try {
      let urlsEvidencia: string[] = []

      // 1. Upload de fotos de evidência (só contestação)
      if (isContestacao && fotosEvidencia.length > 0) {
        setStatus('uploading')
        const uploads = await Promise.allSettled(
          fotosEvidencia.slice(0, 5).map((file, i) => {
            const ext = file.name.split('.').pop()
            const path = `contestacoes/${projetoId}/${i}-${Date.now()}.${ext}`
            return uploadImagemPortfolio(path, file)
          })
        )

        const falhas: string[] = []
        uploads.forEach((result, i) => {
          if (result.status === 'fulfilled') {
            urlsEvidencia.push(result.value)
          } else {
            falhas.push(fotosEvidencia[i].name)
          }
        })

        if (falhas.length > 0) {
          setErro(`Arquivos com falha: ${falhas.join(', ')}`)
        }
      }

      // 2. Salvar avaliação
      setStatus('saving')
      await inserirAvaliacao({
        projeto_id: projetoId,
        prestador_id: String(prestadorId),  // ✅ converte number → string
        nota: isContestacao ? 1 : nota,
        comentario,
        indica: !isContestacao,
        visivel: !isContestacao,
        status: isContestacao ? 'em_disputa' : 'finalizado',
      })

      // 3. Finalizar projeto ou marcar em disputa
      if (!isContestacao) {
        await finalizarProjeto(projetoId)
      } else {
        await marcarProjetoEmDisputa(projetoId)
      }

      setStatus('done')
      onComplete()
    } catch (err) {
      console.error('Erro ao submeter avaliação:', err)
      setErro('Erro ao salvar. Tente novamente.')
      setStatus('error')
    }
  }

  return { status, erro, submit }
}