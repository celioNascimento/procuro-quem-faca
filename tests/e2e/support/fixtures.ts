// tests/e2e/support/fixtures.ts
//
// Identificadores FICTÍCIOS da semente do banco de teste (nunca existem em produção).
// Se a semente mudar, atualize aqui e rode e2e_capturar_baseline() no banco de teste.

/** Projeto "em execução": aceita avaliação por token. */
export const PROJETO_EM_EXECUCAO_TOKEN = 'c45791f1-8ae6-4517-8d38-b98438e20994';

/** Links pessoais de perfis sem dono (reivindicar / excluir). */
export const LINKS_PERFIL = {
  assumir: { id: 4, nome: 'Maria Eletricista Teste', token: 'aa46b8fa-091e-4fc4-ae50-fc61c3f336f2' },
  excluir: { id: 5, nome: 'João Encanador Teste', token: 'e52cfe0f-9e04-4b56-82f1-6ea8ae35574d' },
} as const;

/** UUID bem formado, mas inexistente. */
export const TOKEN_INEXISTENTE = '00000000-0000-4000-8000-00000000dead';
