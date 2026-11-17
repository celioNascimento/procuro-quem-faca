// tests/e2e/homologacao/reivindicar.spec.ts
//
// Link pessoal do titular: assumir ou excluir um perfil sem dono. Banco restaurado antes de cada teste.

import { expect, test } from '@playwright/test';
import { motivoParaPular } from '../support/ambiente';
import { LINKS_PERFIL, TOKEN_INEXISTENTE } from '../support/fixtures';
import { resetarFixtures } from '../support/reset';

test.skip(motivoParaPular() !== null, motivoParaPular() ?? '');
test.describe.configure({ mode: 'serial' });

test.describe('reivindicar / excluir por link pessoal (grava no banco de teste)', () => {
  test.beforeEach(async () => {
    await resetarFixtures();
  });

  test('sem link, explica como pedir o link pessoal', async ({ page }) => {
    await page.goto('/reivindicar');
    await expect(page.getByRole('heading', { name: /este perfil é seu/i })).toBeVisible();
  });

  test('link inexistente mostra "Link inválido"', async ({ page }) => {
    await page.goto(`/reivindicar?token=${TOKEN_INEXISTENTE}`);
    await expect(page.getByRole('heading', { name: /link inválido/i })).toBeVisible();
  });

  test('link válido mostra o perfil e, ao assumir, pede login levando ao cadastro', async ({ page }) => {
    const { token, id, nome } = LINKS_PERFIL.assumir;
    await page.goto(`/reivindicar?token=${token}`);
    await expect(page.getByText(nome)).toBeVisible();

    await page.getByRole('button', { name: 'Assumir este perfil' }).click();
    // Sem sessão, o cadastro exige login e devolve o titular ao cadastro depois (parâmetro next).
    await expect(page).toHaveURL(/\/login\?next=/);
    const next = new URL(page.url()).searchParams.get('next') ?? '';
    expect(next).toBe(`/cadastro?reivindicar=${id}&token=${token}`);
  });

  test('"Voltar" na confirmação de exclusão não apaga nada', async ({ page }) => {
    await page.goto(`/reivindicar?token=${LINKS_PERFIL.excluir.token}`);
    await page.getByRole('button', { name: 'Prefiro excluir meu perfil' }).click();
    await expect(page.getByRole('heading', { name: /excluir perfil/i })).toBeVisible();

    // O cabeçalho também tem um "Voltar": o da confirmação é o último da página.
    await page.getByRole('button', { name: 'Voltar' }).last().click();
    await expect(page.getByRole('button', { name: 'Assumir este perfil' })).toBeVisible();
  });

  test('titular exclui o perfil e o link deixa de valer', async ({ page }) => {
    const { token } = LINKS_PERFIL.excluir;
    await page.goto(`/reivindicar?token=${token}`);
    await page.getByRole('button', { name: 'Prefiro excluir meu perfil' }).click();
    await page.getByRole('button', { name: 'Sim, excluir meu perfil' }).click();
    await expect(page.getByRole('heading', { name: /perfil excluído/i })).toBeVisible({ timeout: 20_000 });

    await page.goto(`/reivindicar?token=${token}`);
    await expect(page.getByRole('heading', { name: /link inválido/i })).toBeVisible();
  });
});
