// lib/selos/checklistDocumentos.ts
// Roteiro de conferência da equipe para seguro e CND (ver documentacao/docs/23-roteiro-conferencia-seguro-cnd.md).
// Aprovar só libera com todos os itens marcados; a rejeição não exige checklist (exige motivo).

import type { TipoDocumento } from './documentos'

export interface ItemChecklist {
  id: string
  texto: string
}

export const CHECKLIST: Record<TipoDocumento, ItemChecklist[]> = {
  seguro: [
    { id: 'segurado', texto: 'O segurado na apólice é o mesmo CNPJ / razão social mostrado acima.' },
    { id: 'tipo_rc', texto: 'A apólice é de responsabilidade civil (RC).' },
    { id: 'vigencia', texto: 'Está dentro da vigência hoje e a data de término informada abaixo é a que consta nela.' },
    { id: 'dados', texto: 'Seguradora e número da apólice conferem com o que o prestador informou.' },
    { id: 'legivel', texto: 'O documento está legível e completo (sem cortes ou rasuras).' },
  ],
  cnd: [
    { id: 'cnpj', texto: 'O CNPJ da certidão é o mesmo mostrado acima.' },
    { id: 'tipo', texto: 'É CND ou CPEND (positiva com efeitos de negativa). Certidão apenas positiva não vale.' },
    { id: 'emissao', texto: 'A data de emissão informada abaixo é a que consta na certidão.' },
    { id: 'autentica', texto: 'Confirmei o código de controle no site da Receita Federal.' },
    { id: 'legivel', texto: 'O documento está legível e completo.' },
  ],
}

/** Todos os itens do tipo estão marcados? */
export function checklistCompleto(tipo: TipoDocumento, marcados: readonly string[]): boolean {
  return CHECKLIST[tipo].every((i) => marcados.includes(i.id))
}

/** Itens que ainda faltam marcar (para dizer à equipe o que falta). */
export function itensPendentes(tipo: TipoDocumento, marcados: readonly string[]): ItemChecklist[] {
  return CHECKLIST[tipo].filter((i) => !marcados.includes(i.id))
}

/** O CNPJ do documento tem de ser o do perfil: texto de apoio quando o prestador ainda não tem CNPJ aprovado. */
export const AVISO_SEM_CNPJ =
  'Este prestador não tem CNPJ no perfil. Sem ele não dá para conferir o titular: rejeite e peça o CNPJ primeiro.'
