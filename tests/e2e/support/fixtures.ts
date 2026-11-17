// tests/e2e/support/fixtures.ts
//
// Identificadores FICTÍCIOS da semente do banco de teste (nunca existem em produção).
// Se a semente mudar, atualize aqui e rode e2e_capturar_baseline() no banco de teste.

/** Projeto da cliente de teste, em execução e já marcado como concluído: pronto para ser avaliado. */
export const PROJETO_PRONTO_TOKEN = 'b7d1c2e4-5f60-4a71-8b92-0c3d4e5f6a7b';

/** Links pessoais de perfis sem dono (reivindicar / excluir). */
export const LINKS_PERFIL = {
  assumir: { id: 4, nome: 'Maria Eletricista Teste', token: 'aa46b8fa-091e-4fc4-ae50-fc61c3f336f2' },
  excluir: { id: 5, nome: 'João Encanador Teste', token: 'e52cfe0f-9e04-4b56-82f1-6ea8ae35574d' },
} as const;

/** UUID bem formado, mas inexistente. */
export const TOKEN_INEXISTENTE = '00000000-0000-4000-8000-00000000dead';
