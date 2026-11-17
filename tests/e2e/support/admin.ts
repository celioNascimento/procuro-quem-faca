// tests/e2e/support/admin.ts
//
// Ajudante: decide uma verificação de CNPJ como administrador, direto pelas funções do banco de TESTE
// (as mesmas que a tela do admin usa). Serve para montar o cenário "selo aprovado" sem consulta externa.

import { expect, type APIRequestContext } from '@playwright/test';
import { CONTA_ADMIN, SUPABASE_TESTE_ANON_KEY, SUPABASE_TESTE_URL } from './ambiente';

export async function decidirCnpjComoAdmin(
  request: APIRequestContext,
  nomePrestador: string,
  decisao: 'aprovada' | 'rejeitada',
  /** Em qual lista a verificação está: pendente (aprovar/rejeitar) ou aprovada (revogar). */
  lista: 'pendentes' | 'aprovadas' = 'pendentes',
) {
  const login = await request.post(`${SUPABASE_TESTE_URL}/auth/v1/token?grant_type=password`, {
    headers: { apikey: SUPABASE_TESTE_ANON_KEY, 'Content-Type': 'application/json' },
    data: { email: CONTA_ADMIN.email, password: CONTA_ADMIN.senha },
  });
  expect(login.ok(), await login.text()).toBe(true);
  const { access_token } = await login.json();
  const cabecalho = {
    apikey: SUPABASE_TESTE_ANON_KEY,
    Authorization: `Bearer ${access_token}`,
    'Content-Type': 'application/json',
  };
  const fila = await request.post(`${SUPABASE_TESTE_URL}/rest/v1/rpc/admin_fila_verificacoes`, {
    headers: cabecalho,
    data: { p_filtro: lista },
  });
  expect(fila.ok(), await fila.text()).toBe(true);
  const alvo = (await fila.json()).find((v: { prestador_nome: string }) => v.prestador_nome === nomePrestador);
  expect(alvo, `verificação de ${nomePrestador} em "${lista}"`).toBeTruthy();
  const decide = await request.post(`${SUPABASE_TESTE_URL}/rest/v1/rpc/admin_decidir_verificacao`, {
    headers: cabecalho,
    data: { p_verificacao_id: alvo.verificacao_id, p_decisao: decisao },
  });
  expect(decide.ok(), await decide.text()).toBe(true);
}
