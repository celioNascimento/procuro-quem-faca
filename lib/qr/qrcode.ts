// lib/qr/qrcode.ts
//
// Gerador de QR Code (modo byte/UTF-8, correção de erro M, versões 1–10) sem dependências.
// Serve para o QR do perfil nos materiais de divulgação (adesivo, cartão, card de WhatsApp).
// Capacidade: até 213 bytes — sobra para qualquer URL de perfil.
//
// Referência: ISO/IEC 18004. Validado por decodificação (OpenCV) e testes estruturais.

export type MatrizQr = boolean[][]

// ── Tabelas (nível de correção M) ─────────────────────────────────────────

interface VersaoInfo {
  ecPorBloco: number
  /** grupos: [quantidade de blocos, bytes de dados por bloco] */
  grupos: [number, number][]
  alinhamento: number[]
}

const VERSOES_M: Record<number, VersaoInfo> = {
  1: { ecPorBloco: 10, grupos: [[1, 16]], alinhamento: [] },
  2: { ecPorBloco: 16, grupos: [[1, 28]], alinhamento: [6, 18] },
  3: { ecPorBloco: 26, grupos: [[1, 44]], alinhamento: [6, 22] },
  4: { ecPorBloco: 18, grupos: [[2, 32]], alinhamento: [6, 26] },
  5: { ecPorBloco: 24, grupos: [[2, 43]], alinhamento: [6, 30] },
  6: { ecPorBloco: 16, grupos: [[4, 27]], alinhamento: [6, 34] },
  7: { ecPorBloco: 18, grupos: [[4, 31]], alinhamento: [6, 22, 38] },
  8: { ecPorBloco: 22, grupos: [[2, 38], [2, 39]], alinhamento: [6, 24, 42] },
  9: { ecPorBloco: 22, grupos: [[3, 36], [2, 37]], alinhamento: [6, 26, 46] },
  10: { ecPorBloco: 26, grupos: [[4, 43], [1, 44]], alinhamento: [6, 28, 50] },
}

const BITS_RESTANTES: Record<number, number> = { 1: 0, 2: 7, 3: 7, 4: 7, 5: 7, 6: 7, 7: 0, 8: 0, 9: 0, 10: 0 }

// ── Corpo de Galois GF(256), polinômio 0x11D ──────────────────────────────

const EXP = new Uint8Array(512)
const LOG = new Uint8Array(256)
;(() => {
  let x = 1
  for (let i = 0; i < 255; i++) {
    EXP[i] = x
    LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]
})()

function gfMul(a: number, b: number): number {
  return a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]
}

function geradorRs(grau: number): number[] {
  let poli = [1]
  for (let i = 0; i < grau; i++) {
    const prox = new Array(poli.length + 1).fill(0)
    for (let j = 0; j < poli.length; j++) {
      prox[j] ^= poli[j]
      prox[j + 1] ^= gfMul(poli[j], EXP[i])
    }
    poli = prox
  }
  return poli
}

function codigosRs(dados: number[], qtdEc: number): number[] {
  const gerador = geradorRs(qtdEc)
  const resto = new Array(qtdEc).fill(0)
  for (const byte of dados) {
    const fator = byte ^ resto.shift()!
    resto.push(0)
    for (let i = 0; i < qtdEc; i++) resto[i] ^= gfMul(gerador[i + 1], fator)
  }
  return resto
}

// ── Codificação dos dados ─────────────────────────────────────────────────

function bytesUtf8(texto: string): number[] {
  return Array.from(new TextEncoder().encode(texto))
}

function totalDados(v: VersaoInfo): number {
  return v.grupos.reduce((s, [n, d]) => s + n * d, 0)
}

function escolherVersao(qtdBytes: number): number {
  for (let ver = 1; ver <= 10; ver++) {
    const bitsContagem = ver <= 9 ? 8 : 16
    const bitsNecessarios = 4 + bitsContagem + qtdBytes * 8
    if (bitsNecessarios <= totalDados(VERSOES_M[ver]) * 8) return ver
  }
  throw new Error('Texto longo demais para o QR Code (máx. 213 bytes).')
}

function montarCodewords(bytes: number[], ver: number): number[] {
  const info = VERSOES_M[ver]
  const capacidade = totalDados(info)
  const bits: number[] = []
  const empurrar = (valor: number, qtd: number) => {
    for (let i = qtd - 1; i >= 0; i--) bits.push((valor >>> i) & 1)
  }
  empurrar(0b0100, 4)
  empurrar(bytes.length, ver <= 9 ? 8 : 16)
  for (const b of bytes) empurrar(b, 8)
  empurrar(0, Math.min(4, capacidade * 8 - bits.length))
  while (bits.length % 8 !== 0) bits.push(0)

  const dados: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j]
    dados.push(b)
  }
  for (let pad = 0; dados.length < capacidade; pad++) dados.push(pad % 2 === 0 ? 0xec : 0x11)

  // divide em blocos, calcula EC e intercala
  const blocosDados: number[][] = []
  let pos = 0
  for (const [qtd, tam] of info.grupos) {
    for (let i = 0; i < qtd; i++) {
      blocosDados.push(dados.slice(pos, pos + tam))
      pos += tam
    }
  }
  const blocosEc = blocosDados.map(b => codigosRs(b, info.ecPorBloco))
  const saida: number[] = []
  const maxDados = Math.max(...blocosDados.map(b => b.length))
  for (let i = 0; i < maxDados; i++) for (const b of blocosDados) if (i < b.length) saida.push(b[i])
  for (let i = 0; i < info.ecPorBloco; i++) for (const b of blocosEc) saida.push(b[i])
  return saida
}

// ── Matriz ────────────────────────────────────────────────────────────────

class Matriz {
  readonly tam: number
  readonly modulos: boolean[][]
  readonly reservado: boolean[][]

  constructor(readonly ver: number) {
    this.tam = 17 + 4 * ver
    this.modulos = Array.from({ length: this.tam }, () => new Array(this.tam).fill(false))
    this.reservado = Array.from({ length: this.tam }, () => new Array(this.tam).fill(false))
  }

  definir(x: number, y: number, escuro: boolean, funcao = true) {
    this.modulos[y][x] = escuro
    if (funcao) this.reservado[y][x] = true
  }

  padroesFuncao() {
    const n = this.tam
    // localizadores + separadores
    for (const [cx, cy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
      for (let dy = -1; dy <= 7; dy++) {
        for (let dx = -1; dx <= 7; dx++) {
          const x = cx + dx
          const y = cy + dy
          if (x < 0 || y < 0 || x >= n || y >= n) continue
          const dentro = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6
          const escuro = dentro && (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4))
          this.definir(x, y, escuro)
        }
      }
    }
    // temporização
    for (let i = 8; i < n - 8; i++) {
      this.definir(i, 6, i % 2 === 0)
      this.definir(6, i, i % 2 === 0)
    }
    // alinhamento
    const pos = VERSOES_M[this.ver].alinhamento
    for (const cy of pos) {
      for (const cx of pos) {
        if ((cx === 6 && cy === 6) || (cx === 6 && cy === n - 7) || (cx === n - 7 && cy === 6)) continue
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            this.definir(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
          }
        }
      }
    }
    // módulo escuro fixo
    this.definir(8, n - 8, true)
    // áreas reservadas para formato
    for (let i = 0; i < 9; i++) {
      this.reservado[8][i] = true
      this.reservado[i][8] = true
    }
    for (let i = 0; i < 8; i++) {
      this.reservado[8][n - 1 - i] = true
      this.reservado[n - 1 - i][8] = true
    }
    // informação de versão (v >= 7)
    if (this.ver >= 7) {
      const info = bchVersao(this.ver)
      for (let i = 0; i < 18; i++) {
        const bit = ((info >>> i) & 1) === 1
        const a = Math.floor(i / 3)
        const b = (i % 3) + n - 11
        this.definir(b, a, bit)
        this.definir(a, b, bit)
      }
    }
  }

  colocarDados(codewords: number[]) {
    const n = this.tam
    const bits: boolean[] = []
    for (const cw of codewords) for (let i = 7; i >= 0; i--) bits.push(((cw >>> i) & 1) === 1)
    for (let i = 0; i < BITS_RESTANTES[this.ver]; i++) bits.push(false)

    let idx = 0
    let sobe = true
    for (let col = n - 1; col > 0; col -= 2) {
      if (col === 6) col--
      for (let passo = 0; passo < n; passo++) {
        const y = sobe ? n - 1 - passo : passo
        for (let k = 0; k < 2; k++) {
          const x = col - k
          if (this.reservado[y][x]) continue
          this.modulos[y][x] = idx < bits.length ? bits[idx] : false
          idx++
        }
      }
      sobe = !sobe
    }
  }

  aplicarMascara(m: number) {
    for (let y = 0; y < this.tam; y++) {
      for (let x = 0; x < this.tam; x++) {
        if (this.reservado[y][x]) continue
        if (condicaoMascara(m, x, y)) this.modulos[y][x] = !this.modulos[y][x]
      }
    }
  }

  escreverFormato(m: number) {
    const n = this.tam
    const bits = bchFormato(m)
    const bit = (i: number) => ((bits >>> i) & 1) === 1
    // ao redor do localizador superior esquerdo
    for (let i = 0; i <= 5; i++) this.modulos[i][8] = bit(i)
    this.modulos[7][8] = bit(6)
    this.modulos[8][8] = bit(7)
    this.modulos[8][7] = bit(8)
    for (let i = 9; i < 15; i++) this.modulos[8][14 - i] = bit(i)
    // cópia nos outros dois localizadores
    for (let i = 0; i < 8; i++) this.modulos[8][n - 1 - i] = bit(i)
    for (let i = 8; i < 15; i++) this.modulos[n - 15 + i][8] = bit(i)
    this.modulos[n - 8][8] = true
  }
}

function condicaoMascara(m: number, x: number, y: number): boolean {
  switch (m) {
    case 0: return (x + y) % 2 === 0
    case 1: return y % 2 === 0
    case 2: return x % 3 === 0
    case 3: return (x + y) % 3 === 0
    case 4: return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0
    case 5: return ((x * y) % 2) + ((x * y) % 3) === 0
    case 6: return ((((x * y) % 2) + ((x * y) % 3)) % 2) === 0
    default: return ((((x + y) % 2) + ((x * y) % 3)) % 2) === 0
  }
}

function bchFormato(mascara: number): number {
  const dados = (0b00 << 3) | mascara // nível M = 00
  let resto = dados
  for (let i = 0; i < 10; i++) resto = (resto << 1) ^ ((resto >>> 9) * 0x537)
  return ((dados << 10) | resto) ^ 0x5412
}

function bchVersao(ver: number): number {
  let resto = ver
  for (let i = 0; i < 12; i++) resto = (resto << 1) ^ ((resto >>> 11) * 0x1f25)
  return (ver << 12) | resto
}

function penalidade(mat: Matriz): number {
  const n = mat.tam
  const g = mat.modulos
  let total = 0

  const linhaPenalidade = (get: (i: number) => boolean) => {
    let p = 0
    let corrida = 1
    for (let i = 1; i < n; i++) {
      if (get(i) === get(i - 1)) {
        corrida++
      } else {
        if (corrida >= 5) p += 3 + (corrida - 5)
        corrida = 1
      }
    }
    if (corrida >= 5) p += 3 + (corrida - 5)
    return p
  }
  for (let i = 0; i < n; i++) {
    total += linhaPenalidade(j => g[i][j])
    total += linhaPenalidade(j => g[j][i])
  }

  // blocos 2x2
  for (let y = 0; y < n - 1; y++) {
    for (let x = 0; x < n - 1; x++) {
      const c = g[y][x]
      if (c === g[y][x + 1] && c === g[y + 1][x] && c === g[y + 1][x + 1]) total += 3
    }
  }

  // padrões 1:1:3:1:1 com 4 módulos claros de um lado
  const padrao = [true, false, true, true, true, false, true]
  const checar = (get: (i: number) => boolean, i: number) => {
    for (let k = 0; k < 7; k++) if (get(i + k) !== padrao[k]) return false
    const claro = (a: number, b: number) => {
      for (let k = a; k < b; k++) if (k >= 0 && k < n && get(k)) return false
      return true
    }
    return claro(i - 4, i) || claro(i + 7, i + 11)
  }
  for (let a = 0; a < n; a++) {
    for (let b = 0; b <= n - 7; b++) {
      if (checar(j => g[a][j], b)) total += 40
      if (checar(j => g[j][a], b)) total += 40
    }
  }

  // proporção de módulos escuros
  let escuros = 0
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (g[y][x]) escuros++
  const pct = (escuros * 100) / (n * n)
  total += Math.floor(Math.abs(pct - 50) / 5) * 10

  return total
}

// ── API ───────────────────────────────────────────────────────────────────

/** Gera a matriz do QR Code (true = módulo escuro), sem a zona de silêncio. */
export function gerarMatrizQr(texto: string): MatrizQr {
  const bytes = bytesUtf8(texto)
  const ver = escolherVersao(bytes.length)
  const codewords = montarCodewords(bytes, ver)

  let melhor: Matriz | null = null
  let melhorPontos = Infinity
  for (let m = 0; m < 8; m++) {
    const mat = new Matriz(ver)
    mat.padroesFuncao()
    mat.colocarDados(codewords)
    mat.aplicarMascara(m)
    mat.escreverFormato(m)
    const pontos = penalidade(mat)
    if (pontos < melhorPontos) {
      melhorPontos = pontos
      melhor = mat
    }
  }
  return melhor!.modulos
}
