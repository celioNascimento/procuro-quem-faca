// tests/e2e/homologacao/isolamento.spec.ts
//
// P0 — prova que o ambiente de homologação lê o banco de TESTE, nunca o de produção.
// Este arquivo é a primeira barreira: se falhar, nenhum outro teste de homologação vale.

import { expect, test } from '@playwright/test';
import { PERFIL_SEED, motivoParaPular } from '../support/ambiente';
import { entrar, exigirSomenteBancoDeTeste, vigiarSupabase } from '../support/entrar';

test.skip(motivoParaPular() !== null, motivoParaPular() ?? '');

test.describe('isolamento do ambiente de homologação', () => {
  test('perfil fictício existe e só fala com o banco de teste', async ({ page }) => {
    const hosts = vigiarSupabase(page);
    await page.goto(`/${PERFIL_SEED.slug}`);

    await expect(page.getByRole('heading', { name: PERFIL_SEED.nome }).first()).toBeVisible();
    await page.waitForLoadState('networkidle');

    exigirSomenteBancoDeTeste(hosts);
  });

  test('login por e-mail e senha só fala com o banco de teste', async ({ page }) => {
    const hosts = vigiarSupabase(page);
    await entrar(page, 'prestador');
    await expect(page).toHaveURL(/\/dashboard/);
    await page.waitForLoadState('networkidle');

    expect(hosts.size, 'nenhuma chamada ao Supabase foi observada').toBeGreaterThan(0);
    exigirSomenteBancoDeTeste(hosts);
  });
});
