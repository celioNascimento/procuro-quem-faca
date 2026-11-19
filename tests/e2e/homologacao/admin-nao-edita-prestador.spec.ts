// tests/e2e/homologacao/admin-nao-edita-prestador.spec.ts
//
// Admin não pode alterar o perfil de outra pessoa. Tenta mudar o nome do Pedro com a sessão do admin,
// direto na API do banco de TESTE (o que um admin faria pelo navegador). Nada deve mudar.

import { expect, test } from '@playwright/test';
import { CONTA_ADMIN, motivoParaPular, SUPABASE_TESTE_ANON_KEY, SUPABASE_TESTE_URL } from '../support/ambiente';
import { resetarFixtures } from '../support/reset';

test.skip(motivoParaPular() !== null, motivoParaPular() ?? '');
test.describe.configure({ mode: 'serial', timeout: 60_000 });

test.beforeEach(async () => {
  await resetarFixtures();
});

test('o admin não consegue alterar o nome de um prestador', async ({ request }) => {
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
    Prefer: 'return=representation',
  };

  const tentativa = await request.patch(`${SUPABASE_TESTE_URL}/rest/v1/prestadores?id=eq.2`, {
    headers: cabecalho,
    data: { nome: 'Nome alterado pelo admin' },
  });
  // Sem permissão, o banco responde 200 com lista vazia (nenhuma linha atingida) ou um erro de permissão.
  const corpo = tentativa.ok() ? await tentativa.json() : [];
  expect(Array.isArray(corpo) ? corpo.length : 0).toBe(0);

  const leitura = await request.get(`${SUPABASE_TESTE_URL}/rest/v1/prestadores?id=eq.2&select=nome`, { headers: cabecalho });
  expect(leitura.ok()).toBe(true);
  expect((await leitura.json())[0].nome).not.toBe('Nome alterado pelo admin');
});
