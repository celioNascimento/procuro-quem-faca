// lib/meusDados/resumo.ts
//
// Apoio da página "Meus dados": resume a exportação feita pelo banco (função exportar_meus_dados)
// e nomeia o arquivo baixado. Sem acesso a dados: só transforma o que já foi carregado.

export interface ConsentimentoExportado {
  tipo: string
  versao_documento: string
  concedido: boolean
  origem: string
  aceito_em: string
}

export interface ExportacaoDados {
  gerado_em: string
  versao_formato: number
  conta: { id: string; email: string | null; criada_em: string | null; ultimo_acesso: string | null } | null
  consentimentos: ConsentimentoExportado[]
  [secao: string]: unknown
}

export interface ItemResumo {
  chave: string
  rotulo: string
  quantidade: number
}

// Ordem em que as seções aparecem na tela
const SECOES: { chave: string; rotulo: string }[] = [
  { chave: 'perfil', rotulo: 'Perfil de cliente' },
  { chave: 'perfil_antigo', rotulo: 'Perfil (versão anterior)' },
  { chave: 'prestador', rotulo: 'Perfil profissional' },
  { chave: 'anunciante', rotulo: 'Conta de anunciante' },
  { chave: 'projetos_como_prestador', rotulo: 'Projetos no portfólio' },
  { chave: 'fotos_do_portfolio', rotulo: 'Fotos do portfólio' },
  { chave: 'orcamentos_como_prestador', rotulo: 'Orçamentos enviados' },
  { chave: 'avaliacoes_recebidas', rotulo: 'Avaliações recebidas' },
  { chave: 'garantias_como_prestador', rotulo: 'Casos de garantia como prestador' },
  { chave: 'projetos_como_cliente', rotulo: 'Projetos como cliente' },
  { chave: 'avaliacoes_feitas', rotulo: 'Avaliações que você fez' },
  { chave: 'avaliacoes_sobre_mim_como_cliente', rotulo: 'Avaliações sobre você como cliente' },
  { chave: 'garantias_como_cliente', rotulo: 'Casos de garantia como cliente' },
  { chave: 'orcamentos_como_cliente', rotulo: 'Orçamentos recebidos' },
  { chave: 'curtidas', rotulo: 'Curtidas' },
  { chave: 'consentimentos', rotulo: 'Aceites dos documentos' },
  { chave: 'pedidos_titular', rotulo: 'Pedidos ao titular' },
  { chave: 'registros_de_atividade', rotulo: 'Registros de atividade' },
]

function quantidadeDe(valor: unknown): number {
  if (Array.isArray(valor)) return valor.length
  return valor && typeof valor === 'object' ? 1 : 0
}

// Só devolve o que existe: seção vazia não aparece
export function resumirExportacao(dados: ExportacaoDados): ItemResumo[] {
  return SECOES
    .map(({ chave, rotulo }) => ({ chave, rotulo, quantidade: quantidadeDe(dados[chave]) }))
    .filter(item => item.quantidade > 0)
}

export const ROTULO_CONSENTIMENTO: Record<string, string> = {
  termos_uso: 'Termos de Uso',
  politica_privacidade: 'Política de Privacidade',
  termo_fotos_terceiros: 'Fotos de terceiros',
  comunicacao_whatsapp: 'Comunicação por WhatsApp',
}

export function nomeArquivoExportacao(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `meus-dados-pqf-${data.getFullYear()}-${mes}-${dia}.json`
}
