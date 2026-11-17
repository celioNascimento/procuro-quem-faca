// lib/cnpj/motivoFila.ts
// Texto, em português simples, do motivo pelo qual o CNPJ foi para a fila de revisão.

export function textoMotivoFila(motivo: string | null | undefined): string {
  switch (motivo) {
    case 'nome_nao_confere':
      return 'O nome do cadastro não é igual à razão social, ao nome fantasia nem a um sócio.'
    case 'situacao_nao_ativa':
      return 'A Receita não mostra este CNPJ como ativo.'
    default:
      return 'Enviado para conferência.'
  }
}

/** Só CNPJ com situação ATIVA pode ser aprovado (o banco também confere). */
export function podeAprovar(situacao: string | null | undefined): boolean {
  return situacao === 'ATIVA'
}
