// tests/e2e/support/reset.ts
//
// Devolve o banco de TESTE ao estado da semente antes de um teste que grava dados.
// Chama a função e2e_resetar_fixtures(), que só existe no banco de homologação e
// se recusa a rodar sem o marcador "homologacao".

import { SUPABASE_TESTE_ANON_KEY, SUPABASE_TESTE_REF, SUPABASE_TESTE_URL } from './ambiente';

export async function resetarFixtures() {
  // Trava dupla: nunca chama o reset em outro projeto que não o de teste.
  if (!SUPABASE_TESTE_URL.includes(SUPABASE_TESTE_REF)) {
    throw new Error(`Reset recusado: ${SUPABASE_TESTE_URL} não é o banco de teste.`);
  }

  const resposta = await fetch(`${SUPABASE_TESTE_URL}/rest/v1/rpc/e2e_resetar_fixtures`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_TESTE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_TESTE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });

  if (!resposta.ok) {
    throw new Error(`Reset das fixtures falhou (HTTP ${resposta.status}): ${await resposta.text()}`);
  }
}

/**
 * Cria no banco de TESTE uma conta já confirmada (o projeto exige confirmação por e-mail, que um
 * e-mail .invalid nunca recebe). Só aceita e-mails e2e-*@pqf-teste.invalid; o reset apaga a conta.
 */
export async function criarContaConfirmada(email: string, senha: string) {
  if (!SUPABASE_TESTE_URL.includes(SUPABASE_TESTE_REF)) {
    throw new Error(`Criação recusada: ${SUPABASE_TESTE_URL} não é o banco de teste.`);
  }
  const resposta = await fetch(`${SUPABASE_TESTE_URL}/rest/v1/rpc/e2e_criar_conta`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_TESTE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_TESTE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_email: email, p_senha: senha }),
  });
  if (!resposta.ok) {
    throw new Error(`Criação da conta de teste falhou (HTTP ${resposta.status}): ${await resposta.text()}`);
  }
}
