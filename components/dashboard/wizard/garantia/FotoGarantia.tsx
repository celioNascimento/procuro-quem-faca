// components/dashboard/wizard/garantia/FotoGarantia.tsx
//
// Substitui <img src={foto.url_foto}> direto em todos os pontos que exibem
// fotos de garantia. O bucket 'garantia' é privado — url_foto guarda um
// PATH (não uma URL pronta) para fotos ainda não promovidas (publica=false).
// Este componente resolve a URL assinada sob demanda, com fallback para
// URL direta quando a foto já foi promovida para o bucket público
// (publica=true), caso em que url_foto já é uma URL completa e utilizável.

'use client'

import { useState, useEffect } from 'react'
import { ImageOff, Loader2 } from 'lucide-react'
import { getUrlAssinadaGarantia } from '@/lib/services/garantiaWizard.service'

interface Props {
  path: string
  publica?: boolean
  className?: string
  alt?: string
  onClick?: () => void
}

export function FotoGarantia({ path, publica = false, className = '', alt = '', onClick }: Props) {
  const [url, setUrl] = useState<string | null>(publica ? path : null)
  const [loading, setLoading] = useState(!publica)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    if (publica) {
      setUrl(path)
      setLoading(false)
      return
    }
    let cancelado = false
    setLoading(true)
    setErro(false)
    getUrlAssinadaGarantia(path).then((signedUrl) => {
      if (cancelado) return
      if (signedUrl) setUrl(signedUrl)
      else setErro(true)
      setLoading(false)
    })
    return () => { cancelado = true }
  }, [path, publica])

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 ${className}`}>
        <Loader2 size={16} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (erro || !url) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-slate-300 ${className}`}>
        <ImageOff size={16} />
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={alt}
      onClick={onClick}
      className={className}
      onError={() => setErro(true)}
    />
  )
}
