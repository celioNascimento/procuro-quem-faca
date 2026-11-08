// lib/divulgacao/download.ts
export function baixarCanvas(canvas: HTMLCanvasElement, nomeArquivo: string): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) return reject(new Error('Não foi possível gerar a imagem.'))
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = nomeArquivo
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      resolve()
    }, 'image/png')
  })
}

/** Abre o diálogo de impressão (que também salva em PDF) com as artes no tamanho físico exato. */
export function imprimirArtes(canvases: HTMLCanvasElement[], larguraMm: number, alturaMm: number): void {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument
  if (!doc) { iframe.remove(); throw new Error('Impressão indisponível neste navegador.') }
  const imgs = canvases.map(c => `<img src="${c.toDataURL('image/png')}" alt="">`).join('')
  doc.open()
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>Material PQF</title><style>
    @page{size:${larguraMm}mm ${alturaMm}mm;margin:0}
    html,body{margin:0;padding:0}
    img{display:block;width:${larguraMm}mm;height:${alturaMm}mm;page-break-after:always;break-after:page}
    img:last-child{page-break-after:auto;break-after:auto}
  </style></head><body>${imgs}</body></html>`)
  doc.close()
  const imprimir = () => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => iframe.remove(), 60_000)
  }
  // aguarda as imagens decodificarem antes de imprimir
  const pendentes = Array.from(doc.images).filter(i => !i.complete)
  if (pendentes.length === 0) setTimeout(imprimir, 100)
  else Promise.all(pendentes.map(i => new Promise(r => { i.onload = i.onerror = r }))).then(imprimir)
}

export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = texto
      ta.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}
