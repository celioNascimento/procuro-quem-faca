// lib/selos/documentos.ts
// Selos de Seguro (Ouro) e CND (Diamante): regras puras de validação e de texto.
// O banco repete as regras (enviar_documento_verificacao / admin_decidir_documento); aqui só guiamos a pessoa.

export type TipoDocumento = 'seguro' | 'cnd'

export const LIMITE_ARQUIVO_BYTES = 5 * 1024 * 1024
export const TIPOS_ARQUIVO = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const
/** A CND federal vale 180 dias da emissão (Portaria Conjunta RFB/PGFN 1.751/2014). */
export const VALIDADE_CND_DIAS = 180
export const AVISOS_VENCIMENTO_DIAS = [30, 15, 3] as const
/** Janela em que dá para renovar um selo ainda válido. */
export const JANELA_RENOVACAO_DIAS = 30

export type FaseDocumento = 'sem' | 'em_conferencia' | 'aprovado' | 'a_vencer' | 'rejeitado' | 'expirado'

export interface VerificacaoDocumento {
  status: string
  valido_ate: string | null
  dados: Record<string, unknown> | null
}

const MS_DIA = 86_400_000

/** Dias inteiros de hoje até a data (AAAA-MM-DD). Negativo = já passou. */
export function diasAte(data: string, hoje: Date = new Date()): number {
  const alvo = Date.parse(`${data}T00:00:00Z`)
  const base = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  return Math.round((alvo - base) / MS_DIA)
}

export function faseDoDocumento(v: VerificacaoDocumento | null, hoje: Date = new Date()): FaseDocumento {
  if (!v) return 'sem'
  if (v.dados && 'pedido' in v.dados) return 'em_conferencia'
  if (v.status === 'rejeitada') return 'rejeitado'
  if (v.status === 'expirada') return 'expirado'
  if (v.status === 'aprovada' && v.valido_ate) {
    const dias = diasAte(v.valido_ate, hoje)
    if (dias < 0) return 'expirado'
    return dias <= JANELA_RENOVACAO_DIAS ? 'a_vencer' : 'aprovado'
  }
  return 'sem'
}

/** Pode enviar (ou reenviar) o comprovante nesta fase? */
export function podeEnviar(fase: FaseDocumento): boolean {
  return fase === 'sem' || fase === 'rejeitado' || fase === 'expirado' || fase === 'a_vencer'
}

export function validarArquivo(arquivo: { size: number; type: string }): string | null {
  if (!(TIPOS_ARQUIVO as readonly string[]).includes(arquivo.type)) return 'Envie um PDF ou uma foto (JPG, PNG ou WebP).'
  if (arquivo.size > LIMITE_ARQUIVO_BYTES) return 'O arquivo tem mais de 5 MB. Envie uma versão menor.'
  if (arquivo.size === 0) return 'O arquivo está vazio.'
  return null
}

export interface DadosSeguro {
  seguradora: string
  numeroApolice: string
  validade: string // AAAA-MM-DD
}

export function validarSeguro(d: DadosSeguro, hoje: Date = new Date()): string | null {
  if (!d.seguradora.trim()) return 'Informe o nome da seguradora.'
  if (d.seguradora.trim().length > 80) return 'O nome da seguradora é longo demais.'
  if (!d.numeroApolice.trim()) return 'Informe o número da apólice.'
  if (d.numeroApolice.trim().length > 40) return 'O número da apólice é longo demais.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.validade)) return 'Informe até quando a apólice vale.'
  if (diasAte(d.validade, hoje) < 0) return 'A apólice precisa estar dentro da validade.'
  return null
}

/** Caminho do arquivo no bucket privado: <user_id>/<tipo>-<timestamp>.<ext>. */
export function caminhoDoArquivo(userId: string, tipo: TipoDocumento, nome: string, agora: number = Date.now()): string {
  const ext = (nome.split('.').pop() ?? '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'bin'
  return `${userId}/${tipo}-${agora}.${ext}`
}

export const ROTULO_DOCUMENTO: Record<TipoDocumento, string> = { seguro: 'Seguro', cnd: 'CND' }

/** Texto público do selo: diz só o que foi conferido. */
export function textoSeloPublico(tipo: TipoDocumento): string {
  return tipo === 'seguro'
    ? 'Seguro de responsabilidade civil: apólice conferida pela equipe do PQF'
    : 'Certidão negativa de débitos federais (CND) conferida pela equipe do PQF'
}

export function textoVencimento(validadoAte: string, hoje: Date = new Date()): string {
  const dias = diasAte(validadoAte, hoje)
  const [a, m, d] = validadoAte.split('-')
  const data = `${d}/${m}/${a}`
  if (dias < 0) return `Venceu em ${data}`
  if (dias === 0) return `Vence hoje (${data})`
  return `Válido até ${data} (${dias} ${dias === 1 ? 'dia' : 'dias'})`
}

/** Mensagem do aviso de vencimento enviada ao prestador. */
export function mensagemAviso(tipo: TipoDocumento, dias: number): { titulo: string; corpo: string } {
  const nome = tipo === 'seguro' ? 'seguro' : 'CND'
  return {
    titulo: `Seu selo de ${nome} vence em ${dias} ${dias === 1 ? 'dia' : 'dias'}`,
    corpo: `Para manter o selo e o seu nível, envie o comprovante atualizado na aba ${ROTULO_DOCUMENTO[tipo]} do seu painel.`,
  }
}
