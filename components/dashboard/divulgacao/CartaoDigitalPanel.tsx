// components/dashboard/divulgacao/CartaoDigitalPanel.tsx
'use client'
import { useCallback, useRef, useState } from 'react'
import { Download, Link2, Check } from 'lucide-react'
import { CanvasPreview } from './CanvasPreview'
import { desenharCartaoDigital, TAMANHOS_CARTAO, type ImagensArte } from '@/lib/divulgacao/canvas'
import { baixarCanvas, copiarTexto } from '@/lib/divulgacao/download'
import { urlCanonicaPerfil } from '@/lib/divulgacao/links'
import { registrarUsoDivulgacao } from '@/lib/services/divulgacao.service'
import type { DadosDivulgacao, FormatoCartao } from '@/lib/divulgacao/tipos'

const FORMATOS: FormatoCartao[] = ['1:1', '4:3', '9:16']

export function CartaoDigitalPanel({ dados, imagens }: { dados: DadosDivulgacao; imagens: ImagensArte }) {
  const [formato, setFormato] = useState<FormatoCartao>('1:1')
  const [copiado, setCopiado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const link = urlCanonicaPerfil(dados.slug, dados.id)

  const desenhar = useCallback((c: HTMLCanvasElement) => desenharCartaoDigital(c, formato, dados, imagens), [formato, dados, imagens])
  const guardar = useCallback((c: HTMLCanvasElement | null) => { canvasRef.current = c }, [])

  async function baixar() {
    if (!canvasRef.current) return
    setErro(null)
    try {
      await baixarCanvas(canvasRef.current, `cartao-${dados.slug ?? dados.id}-${formato.replace(':', 'x')}.png`)
      registrarUsoDivulgacao(dados.id, 'BAIXAR_MATERIAL_DIVULGACAO', `cartao_${formato}`)
    } catch {
      setErro('Não foi possível gerar a imagem. Tente novamente.')
    }
  }

  async function copiar() {
    if (await copiarTexto(link)) {
      setCopiado(true)
      registrarUsoDivulgacao(dados.id, 'COPIAR_LINK_DIVULGACAO', 'perfil')
      setTimeout(() => setCopiado(false), 2500)
    } else setErro('Não foi possível copiar. Selecione o link e copie manualmente.')
  }

  const t = TAMANHOS_CARTAO[formato]
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">Cartão para WhatsApp</h3>
          <p className="mt-1 text-sm text-slate-600">Imagem pronta com a foto do seu serviço mais recente em destaque, seu nome, especialidade e QR do perfil. Não traz números que mudam, então não fica desatualizada. Baixe e envie no chat ou poste no status.</p>
        </div>
        <div role="radiogroup" aria-label="Formato do cartão" className="flex flex-col gap-2">
          {FORMATOS.map(f => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={formato === f}
              onClick={() => setFormato(f)}
              className={`flex min-h-11 flex-col rounded-xl border px-4 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${formato === f ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
            >
              <span className="text-xs font-black uppercase tracking-wide text-slate-900">{TAMANHOS_CARTAO[f].rotulo}</span>
              <span className="text-xs text-slate-500">{TAMANHOS_CARTAO[f].uso}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <button type="button" onClick={baixar} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
            <Download size={15} aria-hidden="true" /> Baixar imagem
          </button>
          <button type="button" onClick={copiar} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">
            {copiado ? <Check size={15} aria-hidden="true" /> : <Link2 size={15} aria-hidden="true" />}
            {copiado ? 'Link copiado' : 'Copiar link do perfil'}
          </button>
        </div>
        <p role="status" className="min-h-4 text-xs text-red-600">{erro}</p>
        <p className="text-xs text-slate-400">{t.largura}×{t.altura}px · PNG</p>
      </div>
      <div className={`mx-auto w-full ${formato === '9:16' ? 'max-w-xs' : 'max-w-xl'}`}>
        <CanvasPreview desenhar={desenhar} onCanvas={guardar} rotulo={`Pré-visualização do cartão ${t.rotulo}`} />
      </div>
    </div>
  )
}
