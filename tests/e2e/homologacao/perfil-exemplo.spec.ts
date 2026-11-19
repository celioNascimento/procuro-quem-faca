// tests/e2e/homologacao/perfil-exemplo.spec.ts
//
// Perfil de exemplo (divulgação): com `exemplo = true` o perfil some da busca e do sitemap, ganha a faixa
// "Perfil de exemplo" e `noindex`, mas continua abrindo por link direto. O dono não consegue ligar a marca
// sozinho (só o admin). Usa o Pedro da semente; o reset devolve tudo ao normal.

import { expect, test } from '@playwright/test';
import { CONTAS, PERFIL_SEED, motivoParaPular, SUPABASE_TESTE_ANON_KEY, SUPABASE_TESTE_URL } from '../support/ambiente';
import { resetarFixtures } from '../support/reset';
import { marcarExemplo } from '../support/selos';

test.skip(motivoParaPular() !== null, motivoParaPular() ?? '');
test.describe.configure({ mode: 'serial', timeout: 90_000 });

test.beforeEach(async () => {
  await resetarFixtures();
});
test.afterAll(async () => {
  await resetarFixtures();
});

async function token(request: import('@playwright/test').APIRequestContext, email: string, senha: string) {
  const r = await request.post(`${SUPABASE_TESTE_URL}/auth/v1/token?grant_type=password`, {
    headers: { apikey: SUPABASE_TESTE_ANON_KEY, 'Content-Type': 'application/json' },
    data: { email, password: senha },
  });
  expect(r.ok(), await r.text()).toBe(true);
  return (await r.json()).access_token as string;
}

const cab = (t: string) => ({
  apikey: SUPABASE_TESTE_ANON_KEY,
  Authorization: `Bearer ${t}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
});

test('o dono não consegue marcar o próprio perfil como exemplo', async ({ request }) => {
  const t = await token(request, CONTAS.prestador.email, CONTAS.prestador.senha);
  await request.patch(`${SUPABASE_TESTE_URL}/rest/v1/prestadores?id=eq.${PERFIL_SEED.id}`, {
    headers: cab(t),
    data: { exemplo: true },
  });
  const leitura = await request.get(`${SUPABASE_TESTE_URL}/rest/v1/prestadores?id=eq.${PERFIL_SEED.id}&select=exemplo`, { headers: cab(t) });
  expect((await leitura.json())[0].exemplo).toBe(false);
});

test('perfil de exemplo: fora da busca, com faixa e noindex, mas abre por link direto', async ({ page }) => {
  await marcarExemplo(PERFIL_SEED.id, true);

  // Link direto: abre, com a faixa e sem indexação
  await page.goto(`/${PERFIL_SEED.slug}`);
  await expect(page.getByRole('heading', { name: PERFIL_SEED.nome }).first()).toBeVisible();
  await expect(page.getByTestId('aviso-perfil-exemplo')).toBeVisible();
  await expect(page.locator('head meta[name="robots"]')).toHaveAttribute('content', /noindex/);

  // Busca: não aparece
  await page.goto('/');
  await page.getByRole('searchbox').or(page.getByRole('textbox', { name: /o que você procura/i })).first().fill('pedreiro');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/prestadores/);
  await page.waitForLoadState('networkidle');
  await expect(page.getByText(PERFIL_SEED.nome)).toHaveCount(0);
});

test('perfil comum não tem a faixa de exemplo', async ({ page }) => {
  await page.goto(`/${PERFIL_SEED.slug}`);
  await expect(page.getByRole('heading', { name: PERFIL_SEED.nome }).first()).toBeVisible();
  await expect(page.getByTestId('aviso-perfil-exemplo')).toHaveCount(0);
});
