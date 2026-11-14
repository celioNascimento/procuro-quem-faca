// hooks/useVitrine.ts
//
// Estado e ações da Vitrine de fotos no painel do prestador. Cada ação (adicionar, remover, nomear)
// já grava no banco: não existe um botão "salvar" separado para a pessoa esquecer de apertar.
'use client'

import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { fazerUploadFoto } from '@/lib/uploadFoto'
import { salvarVitrine } from '@/lib/services/vitrine.service'
import { fotosRestantes, normalizarVitrine, type Vitrine } from '@/lib/vitrine/vitrine'

export interface MensagemVitrine {
  tipo: 'ok' | 'erro'
  texto: string
}

export function useVitrine(prestadorId: number, inicial: Vitrine) {
  const [titulo, setTitulo] = useState(inicial.titulo)
  const [fotos, setFotos] = useState<string[]>(inicial.fotos)
  const [enviando, setEnviando] = useState(false)
  const [mensagem, setMensagem] = useState<MensagemVitrine | null>(null)
  // Sempre o último valor gravado, para as ações não usarem valores velhos.
  const fotosGravadas = useRef<string[]>(inicial.fotos)
  const tituloGravado = useRef(inicial.titulo)

  const gravar = async (proximasFotos: string[], proximoTitulo: string): Promise<boolean> => {
    try {
      const salvo = await salvarVitrine(prestadorId, { titulo: proximoTitulo, fotos: proximasFotos })
      fotosGravadas.current = salvo.fotos
      tituloGravado.current = salvo.titulo
      setFotos(salvo.fotos)
      setTitulo(salvo.titulo)
      return true
    } catch (e) {
      console.error('[vitrine] erro ao salvar', e)
      setMensagem({ tipo: 'erro', texto: 'Não foi possível salvar agora. Tente de novo.' })
      return false
    }
  }

  const adicionar = async (arquivos: File[]) => {
    const livres = fotosRestantes(fotosGravadas.current)
    if (arquivos.length === 0 || livres === 0) return
    setEnviando(true)
    setMensagem(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setMensagem({ tipo: 'erro', texto: 'Sua sessão expirou. Entre de novo para enviar fotos.' })
        return
      }
      const novas: string[] = []
      let falhas = 0
      let grande: number | null = null
      for (const arquivo of arquivos.slice(0, livres)) {
        const resultado = await fazerUploadFoto(arquivo, `${user.id}/sessao`, 'portfolios')
        if (resultado.ok) novas.push(resultado.url)
        else if (resultado.error === 'TOO_LARGE') grande = resultado.sizeMB
        else falhas += 1
      }
      if (novas.length > 0) {
        const gravou = await gravar([...fotosGravadas.current, ...novas], tituloGravado.current)
        if (gravou) setMensagem({ tipo: 'ok', texto: novas.length === 1 ? 'Foto adicionada à sua vitrine.' : `${novas.length} fotos adicionadas à sua vitrine.` })
      } else if (grande !== null) {
        setMensagem({ tipo: 'erro', texto: `A foto tem ${grande.toFixed(1)} MB e o limite é 10 MB. Escolha uma menor.` })
      } else if (falhas > 0) {
        setMensagem({ tipo: 'erro', texto: 'Não foi possível enviar a foto. Verifique a internet e tente de novo.' })
      }
    } finally {
      setEnviando(false)
    }
  }

  const remover = async (indice: number) => {
    const proximas = fotosGravadas.current.filter((_, i) => i !== indice)
    setMensagem(null)
    const gravou = await gravar(proximas, tituloGravado.current)
    if (gravou) setMensagem({ tipo: 'ok', texto: 'Foto removida.' })
  }

  const salvarTitulo = async () => {
    const limpo = normalizarVitrine({ titulo, fotos: [] }).titulo
    if (limpo === tituloGravado.current) return
    setMensagem(null)
    const gravou = await gravar(fotosGravadas.current, limpo)
    if (gravou) setMensagem({ tipo: 'ok', texto: 'Nome da vitrine salvo.' })
  }

  return { titulo, setTitulo, fotos, enviando, mensagem, adicionar, remover, salvarTitulo }
}
