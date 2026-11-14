// lib/divulgacao/whatsapp.ts
//
// Envio direto pelo WhatsApp. Texto: abre o WhatsApp com a mensagem pronta e a pessoa escolhe quem recebe
// (wa.me sem número). Imagem: o WhatsApp não aceita anexo por link, então no celular usamos a folha de
// compartilhar do aparelho (que já lista o WhatsApp); no computador baixamos a imagem e abrimos o WhatsApp
// com o texto, para a pessoa anexar o arquivo.

/** Endereço que abre o WhatsApp com o texto pronto, sem destinatário definido. */
export function enderecoWhatsappComTexto(texto: string): string {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`
}

/** O aparelho consegue compartilhar uma imagem direto para outros aplicativos (celular, em geral)? */
export function podeCompartilharImagem(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') return false
  try {
    return navigator.canShare({ files: [new File([''], 'a.png', { type: 'image/png' })] })
  } catch {
    return false
  }
}

function canvasParaArquivo(canvas: HTMLCanvasElement, nome: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) return reject(new Error('Não foi possível gerar a imagem.'))
      resolve(new File([blob], nome, { type: 'image/png' }))
    }, 'image/png')
  })
}

export type ResultadoEnvioImagem = 'enviado' | 'cancelado' | 'indisponivel'

/** Abre a folha de compartilhar do aparelho com a imagem e o texto. */
export async function compartilharImagem(canvas: HTMLCanvasElement, nome: string, texto: string): Promise<ResultadoEnvioImagem> {
  if (!podeCompartilharImagem()) return 'indisponivel'
  const arquivo = await canvasParaArquivo(canvas, nome)
  try {
    await navigator.share({ files: [arquivo], text: texto })
    return 'enviado'
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return 'cancelado'
    return 'indisponivel'
  }
}
