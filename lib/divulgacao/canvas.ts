// lib/divulgacao/canvas.ts
//
// Artes de divulgação desenhadas em <canvas> (sem dependências): cartão digital para WhatsApp/Stories,
// adesivo de veículo e cartão de visita. Tudo parte dos mesmos dados do perfil público.
import { gerarMatrizQr, type MatrizQr } from '@/lib/qr/qrcode'
import { formatarTelefone, urlCanonicaPerfil, urlCurta } from './links'
import type { DadosDivulgacao, FormatoCartao } from './tipos'

type Ctx = CanvasRenderingContext2D

const AZUL_ESCURO = '#1e3a8a'
const AZUL = '#2563eb'
const TINTA = '#0f172a'
const CINZA = '#64748b'
const VERDE = '#15803d'
const FONTE = '"Segoe UI", "Helvetica Neue", Arial, sans-serif'

export interface ImagensArte {
  logoPqf: HTMLImageElement | null
  perfil: HTMLImageElement | null
  fotos: HTMLImageElement[]
}

export const TAMANHOS_CARTAO: Record<FormatoCartao, { largura: number; altura: number; rotulo: string; uso: string }> = {
  '1:1': { largura: 1080, altura: 1080, rotulo: 'Quadrado 1:1', uso: 'Chat do WhatsApp e feed' },
  '4:3': { largura: 1200, altura: 900, rotulo: 'Retrato 4:3', uso: 'Chat do WhatsApp (formato clássico)' },
  '9:16': { largura: 1080, altura: 1920, rotulo: 'Stories 9:16', uso: 'Status do WhatsApp e Instagram' },
}

const mm = (v: number, dpi: number) => Math.round((v / 25.4) * dpi)
const cm = (v: number, dpi: number) => mm(v * 10, dpi)

export const MEDIDAS_IMPRESSAO = {
  adesivo: { larguraCm: 30, alturaCm: 15, dpi: 200, px: [cm(30, 200), cm(15, 200)] as const },
  cartao: { larguraMm: 90, alturaMm: 50, dpi: 300, px: [mm(90, 300), mm(50, 300)] as const },
}

// ── Carregamento de imagens ───────────────────────────────────────────────

function carregarImagem(url: string | null | undefined, timeoutMs = 8000): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null)
  return new Promise(resolve => {
    const img = new Image()
    // CORS anônimo: sem isso o canvas fica "contaminado" e não exporta. Se o servidor não
    // permitir, a imagem simplesmente não carrega e a arte sai sem ela.
    img.crossOrigin = 'anonymous'
    const timer = setTimeout(() => resolve(null), timeoutMs)
    img.onload = () => { clearTimeout(timer); resolve(img) }
    img.onerror = () => { clearTimeout(timer); resolve(null) }
    img.src = url
  })
}

export async function carregarImagensArte(dados: DadosDivulgacao): Promise<ImagensArte> {
  const [logoPqf, perfil, ...fotos] = await Promise.all([
    carregarImagem('/logo.png'),
    carregarImagem(dados.fotoPerfilUrl),
    ...dados.fotosPortfolio.slice(0, 4).map(u => carregarImagem(u)),
  ])
  return { logoPqf, perfil, fotos: fotos.filter((f): f is HTMLImageElement => f !== null) }
}

// ── Primitivas ────────────────────────────────────────────────────────────

function caminhoArredondado(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const raio = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + raio, y)
  ctx.arcTo(x + w, y, x + w, y + h, raio)
  ctx.arcTo(x + w, y + h, x, y + h, raio)
  ctx.arcTo(x, y + h, x, y, raio)
  ctx.arcTo(x, y, x + w, y, raio)
  ctx.closePath()
}

function preencher(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, cor: string | CanvasGradient) {
  caminhoArredondado(ctx, x, y, w, h, r)
  ctx.fillStyle = cor
  ctx.fill()
}

function imagemCobrindo(ctx: Ctx, img: HTMLImageElement, x: number, y: number, w: number, h: number, r: number) {
  ctx.save()
  caminhoArredondado(ctx, x, y, w, h, r)
  ctx.clip()
  const escala = Math.max(w / img.width, h / img.height)
  const dw = img.width * escala
  const dh = img.height * escala
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
  ctx.restore()
}

/** Mostra a foto inteira (sem cortar) num quadro arredondado; só corta quando a diferença de proporção é pequena. */
function fotoNoQuadro(ctx: Ctx, img: HTMLImageElement, x: number, y: number, w: number, h: number, r: number) {
  const a = img.width / img.height
  const b = w / h
  const corte = 1 - Math.min(a, b) / Math.max(a, b)
  if (corte <= 0.18) return imagemCobrindo(ctx, img, x, y, w, h, r)
  ctx.save()
  caminhoArredondado(ctx, x, y, w, h, r)
  ctx.clip()
  ctx.fillStyle = '#e2e8f0'
  ctx.fillRect(x, y, w, h)
  // fundo: a própria foto ampliada e esmaecida, para não sobrar faixa vazia
  const esc = Math.max(w / img.width, h / img.height)
  ctx.globalAlpha = 0.35
  ctx.drawImage(img, x + (w - img.width * esc) / 2, y + (h - img.height * esc) / 2, img.width * esc, img.height * esc)
  ctx.globalAlpha = 1
  imagemContida(ctx, img, x, y, w, h)
  ctx.restore()
}

function imagemContida(ctx: Ctx, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const escala = Math.min(w / img.width, h / img.height)
  const dw = img.width * escala
  const dh = img.height * escala
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
}

function fonte(ctx: Ctx, px: number, peso: number | string = 700) {
  ctx.font = `${peso} ${Math.round(px)}px ${FONTE}`
}

/** Menor fonte (>= min) em que o texto cabe na largura. */
function ajustarFonte(ctx: Ctx, texto: string, larguraMax: number, inicial: number, minimo: number, peso: number | string = 800): number {
  let px = inicial
  fonte(ctx, px, peso)
  while (px > minimo && ctx.measureText(texto).width > larguraMax) {
    px -= 2
    fonte(ctx, px, peso)
  }
  return px
}

function quebrarLinhas(ctx: Ctx, texto: string, larguraMax: number, maxLinhas: number): string[] {
  const palavras = texto.split(/\s+/).filter(Boolean)
  const linhas: string[] = []
  let atual = ''
  for (const p of palavras) {
    const teste = atual ? `${atual} ${p}` : p
    if (ctx.measureText(teste).width <= larguraMax || !atual) atual = teste
    else { linhas.push(atual); atual = p }
  }
  if (atual) linhas.push(atual)
  if (linhas.length > maxLinhas) {
    const cortadas = linhas.slice(0, maxLinhas)
    let ultima = cortadas[maxLinhas - 1]
    while (ultima.length > 1 && ctx.measureText(`${ultima}…`).width > larguraMax) ultima = ultima.slice(0, -1)
    cortadas[maxLinhas - 1] = `${ultima}…`
    return cortadas
  }
  return linhas
}

function desenharQr(ctx: Ctx, matriz: MatrizQr, x: number, y: number, tamanho: number, raioFundo = 0) {
  const quiet = 4
  const n = matriz.length
  const mod = tamanho / (n + quiet * 2)
  preencher(ctx, x, y, tamanho, tamanho, raioFundo, '#ffffff')
  ctx.fillStyle = TINTA
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      if (!matriz[j][i]) continue
      // +0.5 evita frestas de arredondamento entre módulos vizinhos
      ctx.fillRect(x + (i + quiet) * mod, y + (j + quiet) * mod, mod + 0.5, mod + 0.5)
    }
  }
}

function pilula(ctx: Ctx, texto: string, x: number, y: number, px: number, corTexto: string, corFundo: string): number {
  fonte(ctx, px, 700)
  const padX = px * 0.7
  const w = ctx.measureText(texto).width + padX * 2
  const h = px * 1.9
  preencher(ctx, x, y, w, h, h / 2, corFundo)
  ctx.fillStyle = corTexto
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillText(texto, x + padX, y + h / 2 + px * 0.04)
  return w
}

function plural(n: number, s: string, p: string) {
  return n === 1 ? s : p
}

function matrizDoPerfil(dados: DadosDivulgacao) {
  const url = urlCanonicaPerfil(dados.slug, dados.id)
  return { url, matriz: gerarMatrizQr(url) }
}

function prepararCanvas(canvas: HTMLCanvasElement, largura: number, altura: number): Ctx {
  canvas.width = largura
  canvas.height = altura
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponível neste navegador.')
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  return ctx
}

// ── Cartão digital (WhatsApp / Stories) ───────────────────────────────────

export function desenharCartaoDigital(canvas: HTMLCanvasElement, formato: FormatoCartao, dados: DadosDivulgacao, imgs: ImagensArte) {
  const { largura: w, altura: h } = TAMANHOS_CARTAO[formato]
  const ctx = prepararCanvas(canvas, w, h)
  const vertical = h / w > 1.3
  const { url, matriz } = matrizDoPerfil(dados)

  // fundo
  const grad = ctx.createLinearGradient(0, 0, w, h)
  grad.addColorStop(0, AZUL_ESCURO)
  grad.addColorStop(1, AZUL)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  const p = Math.round(w * 0.055)
  const topoH = Math.round(h * (vertical ? 0.085 : 0.115))
  const rodapeH = Math.round(h * (vertical ? 0.135 : 0.16))

  // topo: marca + selo
  const logoH = Math.round(topoH * 0.62)
  if (imgs.logoPqf) {
    const lw = (imgs.logoPqf.width / imgs.logoPqf.height) * logoH
    preencher(ctx, p, Math.round((topoH - logoH * 1.4) / 2) + p * 0.2, lw + logoH * 0.7, logoH * 1.4, logoH * 0.35, '#ffffff')
    ctx.drawImage(imgs.logoPqf, p + logoH * 0.35, Math.round((topoH - logoH * 1.4) / 2) + p * 0.2 + logoH * 0.2, lw, logoH)
  } else {
    const bp = ajustarFonte(ctx, 'PROCURO QUEM FAÇA', w * 0.5, logoH * 0.7, 18, 900)
    fonte(ctx, bp, 900)
    ctx.fillStyle = '#ffffff'
    ctx.fillText('PROCURO QUEM FAÇA', p, topoH * 0.7)
  }
  if (dados.verificado) {
    const px = Math.round(topoH * 0.2)
    fonte(ctx, px, 800)
    const t = 'PERFIL VERIFICADO'
    const tw = ctx.measureText(t).width + px * 1.6
    preencher(ctx, w - p - tw, Math.round((topoH - px * 2.2) / 2) + p * 0.2, tw, px * 2.2, px * 1.1, 'rgba(255,255,255,0.18)')
    ctx.fillStyle = '#ffffff'
    ctx.textBaseline = 'middle'
    ctx.fillText(t, w - p - tw + px * 0.8, Math.round(topoH / 2) + p * 0.2 + px * 0.05)
    ctx.textBaseline = 'alphabetic'
  }

  // cartão branco
  const cx = p
  const cy = topoH + Math.round(p * 0.35)
  const cw = w - p * 2
  const ch = h - rodapeH - cy - Math.round(p * 0.25)
  ctx.save()
  ctx.shadowColor = 'rgba(15,23,42,0.35)'
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 12
  preencher(ctx, cx, cy, cw, ch, 44, '#ffffff')
  ctx.restore()

  const q = Math.round(cw * 0.05)
  const ix = cx + q
  const iw = cw - q * 2
  let y = cy + q

  // identidade
  const lado = Math.round(vertical ? iw * 0.3 : Math.min(ch * 0.26, iw * 0.24))
  preencher(ctx, ix, y, lado, lado, 28, '#f1f5f9')
  if (imgs.perfil) {
    ctx.save()
    caminhoArredondado(ctx, ix, y, lado, lado, 28)
    ctx.clip()
    imagemContida(ctx, imgs.perfil, ix + 6, y + 6, lado - 12, lado - 12)
    ctx.restore()
  } else {
    fonte(ctx, lado * 0.42, 900)
    ctx.fillStyle = AZUL
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText((dados.nome.trim()[0] ?? '?').toUpperCase(), ix + lado / 2, y + lado / 2)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
  }
  const tx = ix + lado + Math.round(q * 0.7)
  const tw = iw - lado - Math.round(q * 0.7)
  const nomePx = ajustarFonte(ctx, dados.nome, tw, vertical ? 64 : 56, 30, 900)
  fonte(ctx, nomePx, 900)
  const linhasNome = quebrarLinhas(ctx, dados.nome.toUpperCase(), tw, 2)
  ctx.fillStyle = TINTA
  let ty = y + nomePx * 1.05
  for (const l of linhasNome) {
    ctx.fillText(l, tx, ty)
    ty += nomePx * 1.08
  }
  const sub = [dados.categoria, dados.cidade].filter(Boolean).join('  •  ')
  if (sub) {
    const subPx = ajustarFonte(ctx, sub.toUpperCase(), tw, vertical ? 34 : 28, 18, 700)
    fonte(ctx, subPx, 700)
    ctx.fillStyle = AZUL
    ctx.fillText(sub.toUpperCase(), tx, Math.min(ty + subPx * 0.35, y + lado - 2))
  }
  y += lado + Math.round(q * 0.9)

  // prova social
  const temIndicacoes = dados.totalIndicacoes > 0
  const chips: string[] = []
  if (dados.totalConcluidos > 0) chips.push(`${dados.totalConcluidos} ${plural(dados.totalConcluidos, 'serviço concluído', 'serviços concluídos')}`)
  if (dados.garantiaDias > 0) chips.push(`${dados.garantiaDias} dias de garantia`)
  if (temIndicacoes || chips.length > 0) {
    const blocoH = Math.round(vertical ? iw * 0.2 : Math.min(ch * 0.2, iw * 0.16))
    preencher(ctx, ix, y, iw, blocoH, 28, '#eff6ff')
    let bx = ix + q * 0.8
    if (temIndicacoes) {
      const numPx = blocoH * 0.62
      fonte(ctx, numPx, 900)
      ctx.fillStyle = AZUL
      const num = String(dados.totalIndicacoes)
      ctx.textBaseline = 'middle'
      ctx.fillText(num, bx, y + blocoH / 2 + numPx * 0.04)
      bx += ctx.measureText(num).width + q * 0.35
      const labPx = blocoH * 0.2
      fonte(ctx, labPx, 800)
      ctx.fillStyle = TINTA
      ctx.fillText(plural(dados.totalIndicacoes, 'INDICAÇÃO', 'INDICAÇÕES'), bx, y + blocoH / 2 - labPx * 0.55)
      fonte(ctx, labPx * 0.82, 600)
      ctx.fillStyle = CINZA
      ctx.fillText('de clientes reais', bx, y + blocoH / 2 + labPx * 0.75)
      bx += Math.max(ctx.measureText('de clientes reais').width, labPx * 6.2) + q * 0.5
    }
    ctx.textBaseline = 'alphabetic'
    const chipPx = blocoH * 0.2
    if (vertical) {
      y += blocoH + Math.round(q * 0.5)
      let chx = ix
      for (const c of chips) {
        fonte(ctx, chipPx * 0.92, 700)
        const wChip = ctx.measureText(c).width + chipPx * 1.5
        if (chx + wChip > ix + iw) break
        chx += pilula(ctx, c, chx, y, chipPx * 0.92, VERDE, '#dcfce7') + q * 0.4
      }
      y += chipPx * 0.92 * 1.9 + Math.round(q * 0.8)
    } else {
      let cyChip = y + blocoH / 2 - (chips.length > 1 ? chipPx * 2.0 : chipPx * 0.95)
      for (const c of chips) {
        fonte(ctx, chipPx, 700)
        const wChip = ctx.measureText(c).width + chipPx * 1.4
        if (bx + wChip > ix + iw - q * 0.4) break
        pilula(ctx, c, bx, cyChip, chipPx, VERDE, '#dcfce7')
        cyChip += chipPx * 2.2
      }
      y += blocoH + Math.round(q * 0.8)
    }
  }

  // portfólio
  const restante = cy + ch - q - y
  const fotos = imgs.fotos.slice(0, vertical ? 4 : 3)
  if (fotos.length > 0 && restante > 120) {
    const gap = Math.round(q * 0.4)
    if (vertical) {
      if (fotos.length <= 2) {
        // 1–2 fotos: empilhadas em largura total, cada uma com a altura da sua proporção
        const altMax = (restante - gap * (fotos.length - 1)) / fotos.length
        const alts = fotos.map(f => Math.min(altMax, iw / (f.width / f.height)))
        const total = alts.reduce((a, b) => a + b, 0) + gap * (fotos.length - 1)
        let fy = y + Math.max(0, (restante - total) / 2)
        fotos.forEach((f, i) => { fotoNoQuadro(ctx, f, ix, fy, iw, alts[i], 22); fy += alts[i] + gap })
      } else {
        const colunas = 2
        const linhas = Math.ceil(fotos.length / colunas)
        const cellW = (iw - gap) / colunas
        const cellH = Math.min((restante - gap * (linhas - 1)) / linhas, cellW * 1.1)
        fotos.forEach((f, i) => {
          fotoNoQuadro(ctx, f, ix + (i % colunas) * (cellW + gap), y + Math.floor(i / colunas) * (cellH + gap), cellW, cellH, 22)
        })
      }
    } else {
      const cellW = (iw - gap * (fotos.length - 1)) / fotos.length
      fotos.forEach((f, i) => fotoNoQuadro(ctx, f, ix + i * (cellW + gap), y, cellW, restante, 22))
    }
  }

  // rodapé: chamada + QR
  const qrTam = Math.round(rodapeH * 0.8)
  const qrX = w - p - qrTam
  const qrY = h - rodapeH + Math.round((rodapeH - qrTam) / 2) - Math.round(p * 0.1)
  desenharQr(ctx, matriz, qrX, qrY, qrTam, 18)
  const textoW = qrX - p - Math.round(p * 0.6)
  const chamada = vertical ? 'Escaneie e veja o portfólio completo' : 'Veja o portfólio completo e as indicações'
  const chPx = ajustarFonte(ctx, chamada, textoW, rodapeH * 0.17, 14, 600)
  fonte(ctx, chPx, 600)
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fillText(chamada, p, qrY + qrTam * 0.38)
  const curta = urlCurta(url)
  const urlPx = ajustarFonte(ctx, curta, textoW, rodapeH * 0.26, 18, 900)
  fonte(ctx, urlPx, 900)
  ctx.fillStyle = '#ffffff'
  ctx.fillText(curta, p, qrY + qrTam * 0.78, textoW)
}

// ── Adesivo de veículo / baú de moto (30 × 15 cm) ─────────────────────────

export function desenharAdesivo(canvas: HTMLCanvasElement, dados: DadosDivulgacao, imgs: ImagensArte) {
  const [w, h] = MEDIDAS_IMPRESSAO.adesivo.px
  const ctx = prepararCanvas(canvas, w, h)
  const { url, matriz } = matrizDoPerfil(dados)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)

  // painel azul do QR
  const painelW = Math.round(w * 0.38)
  const grad = ctx.createLinearGradient(w - painelW, 0, w, h)
  grad.addColorStop(0, AZUL_ESCURO)
  grad.addColorStop(1, AZUL)
  ctx.fillStyle = grad
  ctx.fillRect(w - painelW, 0, painelW, h)

  const qrTam = Math.round(h * 0.7)
  const qrX = w - painelW + Math.round((painelW - qrTam) / 2)
  const qrY = Math.round(h * 0.2)
  const eq = 'ESCANEIE E VEJA MEU PORTFÓLIO'
  fonte(ctx, ajustarFonte(ctx, eq, painelW * 0.9, h * 0.075, 12, 900), 900)
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.fillText(eq, w - painelW / 2, Math.round(h * 0.13))
  ctx.textAlign = 'left'
  desenharQr(ctx, matriz, qrX, qrY, qrTam, Math.round(qrTam * 0.04))

  // texto
  const m = Math.round(h * 0.09)
  const larguraTexto = w - painelW - m * 1.6
  const nicho = (dados.categoria ?? 'Profissional').toUpperCase()
  const titulo = dados.verificado ? `${nicho} VERIFICADO` : nicho
  const tPx = ajustarFonte(ctx, titulo, larguraTexto, h * 0.2, h * 0.09, 900)
  fonte(ctx, tPx, 900)
  ctx.fillStyle = AZUL_ESCURO
  const linhas = quebrarLinhas(ctx, titulo, larguraTexto, 2)
  let y = m + tPx * 0.9
  for (const l of linhas) {
    ctx.fillText(l, m, y)
    y += tPx * 1.05
  }
  const nomePx = ajustarFonte(ctx, dados.nome, larguraTexto, h * 0.11, h * 0.06, 800)
  fonte(ctx, nomePx, 800)
  ctx.fillStyle = TINTA
  ctx.fillText(dados.nome, m, y + nomePx * 0.4, larguraTexto)
  y += nomePx * 1.5
  if (dados.cidade) {
    fonte(ctx, h * 0.065, 600)
    ctx.fillStyle = CINZA
    ctx.fillText(dados.cidade, m, y, larguraTexto)
  }

  // base: URL + marca
  const baseY = h - m
  const curta = urlCurta(url)
  const uPx = ajustarFonte(ctx, curta, larguraTexto, h * 0.075, h * 0.04, 900)
  fonte(ctx, uPx, 900)
  ctx.fillStyle = AZUL
  ctx.fillText(curta, m, baseY, larguraTexto)
  if (imgs.logoPqf) {
    const lh = h * 0.13
    const lw = (imgs.logoPqf.width / imgs.logoPqf.height) * lh
    ctx.drawImage(imgs.logoPqf, m, baseY - uPx * 1.5 - lh, Math.min(lw, larguraTexto * 0.5), lh)
  }
}

// ── Cartão de visita (90 × 50 mm) ─────────────────────────────────────────

export function desenharCartaoVisita(canvas: HTMLCanvasElement, lado: 'frente' | 'verso', dados: DadosDivulgacao, imgs: ImagensArte) {
  const [w, h] = MEDIDAS_IMPRESSAO.cartao.px
  const ctx = prepararCanvas(canvas, w, h)
  const { url, matriz } = matrizDoPerfil(dados)
  const seguro = mm(5, MEDIDAS_IMPRESSAO.cartao.dpi) // margem de segurança de 5 mm

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)

  if (lado === 'verso') {
    const qrTam = Math.round(h * 0.6)
    const qrY = seguro
    desenharQr(ctx, matriz, seguro, qrY, qrTam, 0)
    const tx = seguro + qrTam + seguro * 0.8
    const tw = w - tx - seguro
    fonte(ctx, h * 0.085, 900)
    ctx.fillStyle = AZUL_ESCURO
    const chamada = quebrarLinhas(ctx, 'ESCANEIE E VEJA MEU PORTFÓLIO', tw, 3)
    let y = qrY + h * 0.1
    for (const l of chamada) {
      ctx.fillText(l, tx, y)
      y += h * 0.1
    }
    fonte(ctx, h * 0.055, 600)
    ctx.fillStyle = CINZA
    const sub = quebrarLinhas(ctx, 'Fotos de serviços reais e indicações de clientes', tw, 3)
    y += h * 0.02
    for (const l of sub) {
      ctx.fillText(l, tx, y)
      y += h * 0.07
    }
    const curta = urlCurta(url)
    const uPx = ajustarFonte(ctx, curta, w - seguro * 2, h * 0.07, h * 0.04, 900)
    fonte(ctx, uPx, 900)
    ctx.fillStyle = AZUL
    ctx.fillText(curta, seguro, h - seguro * 0.75, w - seguro * 2)
    if (imgs.logoPqf) {
      const lh = h * 0.14
      const lw = (imgs.logoPqf.width / imgs.logoPqf.height) * lh
      ctx.drawImage(imgs.logoPqf, w - seguro - lw, h - seguro * 0.75 - lh * 0.8, lw, lh)
    }
    return
  }

  // frente
  const faixa = Math.round(w * 0.05)
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, AZUL_ESCURO)
  grad.addColorStop(1, AZUL)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, faixa, h)

  const tx = faixa + seguro
  const tw = w - tx - seguro
  const nomePx = ajustarFonte(ctx, dados.nome.toUpperCase(), tw, h * 0.12, h * 0.07, 900)
  fonte(ctx, nomePx, 900)
  ctx.fillStyle = TINTA
  const linhasNome = quebrarLinhas(ctx, dados.nome.toUpperCase(), tw, 2)
  let y = seguro + nomePx * 0.8
  for (const l of linhasNome) {
    ctx.fillText(l, tx, y)
    y += nomePx * 1.08
  }
  const nicho = [dados.categoria, dados.verificado ? 'Verificado' : null].filter(Boolean).join(' • ')
  if (nicho) {
    const nPx = ajustarFonte(ctx, nicho.toUpperCase(), tw, h * 0.075, h * 0.045, 800)
    fonte(ctx, nPx, 800)
    ctx.fillStyle = AZUL
    ctx.fillText(nicho.toUpperCase(), tx, y + nPx * 0.3, tw)
    y += nPx * 1.5
  }
  const linhasContato = [
    dados.whatsapp ? `WhatsApp ${formatarTelefone(dados.whatsapp)}` : null,
    dados.cidade ? `${dados.cidade}${dados.slug ? '' : ''}` : null,
  ].filter(Boolean) as string[]
  fonte(ctx, h * 0.066, 600)
  ctx.fillStyle = CINZA
  let cyL = Math.max(y + h * 0.04, h * 0.58)
  for (const l of linhasContato) {
    ctx.fillText(l, tx, cyL, tw)
    cyL += h * 0.085
  }
  const curta = urlCurta(url)
  const uPx = ajustarFonte(ctx, curta, tw, h * 0.07, h * 0.04, 900)
  fonte(ctx, uPx, 900)
  ctx.fillStyle = AZUL
  ctx.fillText(curta, tx, h - seguro * 0.75, tw)
}

/** Texto alternativo curto para a pré-visualização. */
export function descricaoArte(nome: string, tipo: string) {
  return `${tipo} de ${nome}`
}
