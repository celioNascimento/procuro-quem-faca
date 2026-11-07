// components/dashboard/divulgacao/MaterialFisicoPanel.tsx
'use client'
import { useCallback, useRef, useState } from 'react'
import { Download, Printer } from 'lucide-react'
import { CanvasPreview } from './CanvasPreview'
import { desenharAdesivo, desenharCartaoVisita, MEDIDAS_IMPRESSAO, type ImagensArte } from '@/lib/divulgacao/canvas'
import { baixarCanvas, imprimirArtes } from '@/lib/divulgacao/download'
import { registrarUsoDivulgacao } from '@/lib/services/divulgacao.service'
import type { DadosDivulgacao } from '@/lib/divulgacao/tipos'

type Material = 'adesivo' | 'cartao'

export function MaterialFisicoPanel({ dados, imagens }: { dados: DadosDivulgacao; imagens: ImagensArte }) {
  const [material, setMaterial] = useState<Material>('adesivo')
  const [erro, setErro] = useState<string | null>(null)
  const canvases = useRef<Record<string, HTMLCanvasElement | null>>({})

  const adesivo = useCallback((c: HTMLCanvasElement) => desenharAdesivo(c, dados, imagens), [dados, imagens])
  const frente = useCallback((c: HTMLCanvasElement) => desenharCartaoVisita(c, 'frente', dados, imagens), [dados, imagens])
  const verso = useCallback((c: HTMLCanvasElement) => desenharCartaoVisita(c, 'verso', dados, imagens), [dados, imagens])
  const gAdesivo = useCallback((c: HTMLCanvasElement | null) => { canvases.current.adesivo = c }, [])
  const gFrente = useCallback((c: HTMLCanvasElement | null) => { canvases.current.frente = c }, [])
  const gVerso = useCallback((c: HTMLCanvasElement | null) => { canvases.current.verso = c }, [])

  const ativos = material === 'adesivo' ? ['adesivo'] : ['frente', 'verso']
  const medida = material === 'adesivo' ? MEDIDAS_IMPRESSAO.adesivo : MEDIDAS_IMPRESSAO.cartao
  const largMm = material === 'adesivo' ? MEDIDAS_IMPRESSAO.adesivo.larguraCm * 10 : MEDIDAS_IMPRESSAO.cartao.larguraMm
  const altMm = material === 'adesivo' ? MEDIDAS_IMPRESSAO.adesivo.alturaCm * 10 : MEDIDAS_IMPRESSAO.cartao.alturaMm

  async function baixar() {
    setErro(null)
    try {
      for (const k of ativos) {
        const c = canvases.current[k]
        if (c) await baixarCanvas(c, `${k}-${dados.slug ?? dados.id}.png`)
      }
      registrarUsoDivulgacao(dados.id, 'BAIXAR_MATERIAL_DIVULGACAO', material)
    } catch { setErro('Não foi possível gerar o arquivo. Tente novamente.') }
  }

  function imprimir() {
    setErro(null)
    const lista = ativos.map(k => canvases.current[k]).filter((c): c is HTMLCanvasElement => Boolean(c))
    try {
      imprimirArtes(lista, largMm, altMm)
      registrarUsoDivulgacao(dados.id, 'BAIXAR_MATERIAL_DIVULGACAO', `${material}_pdf`)
    } catch { setErro('Impressão indisponível neste navegador. Use "Baixar PNG".') }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">Adesivos e cartão de visita</h3>
        <p className="mt-1 text-sm text-slate-600">Arte com QR Code do seu perfil, pronta para levar à gráfica. O cliente escaneia e vê seu portfólio e as indicações.</p>
      </div>
      <div role="radiogroup" aria-label="Tipo de material" className="flex gap-2">
        {([['adesivo', 'Adesivo veículo / baú'], ['cartao', 'Cartão de visita']] as const).map(([id, rotulo]) => (
          <button key={id} type="button" role="radio" aria-checked={material === id} onClick={() => setMaterial(id)}
            className={`min-h-11 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${material === id ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
            {rotulo}
          </button>
        ))}
      </div>

      {material === 'adesivo' ? (
        <div className="max-w-2xl"><CanvasPreview desenhar={adesivo} onCanvas={gAdesivo} rotulo="Pré-visualização do adesivo 30 por 15 centímetros" /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
          <div><p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Frente</p><CanvasPreview desenhar={frente} onCanvas={gFrente} rotulo="Pré-visualização da frente do cartão de visita" /></div>
          <div><p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Verso</p><CanvasPreview desenhar={verso} onCanvas={gVerso} rotulo="Pré-visualização do verso do cartão de visita" /></div>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={imprimir} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
          <Printer size={15} aria-hidden="true" /> Imprimir / salvar PDF
        </button>
        <button type="button" onClick={baixar} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">
          <Download size={15} aria-hidden="true" /> Baixar PNG
        </button>
      </div>
      <p role="status" className="min-h-4 text-xs text-red-600">{erro}</p>
      <p className="text-xs text-slate-500">
        Tamanho real: {largMm / 10} × {altMm / 10} cm · {medida.dpi} dpi. No diálogo de impressão, escolha “Salvar como PDF” e “Tamanho real / 100%”. A arte não inclui sangria: informe isso à gráfica ou peça para ela aplicar.
      </p>
    </div>
  )
}
