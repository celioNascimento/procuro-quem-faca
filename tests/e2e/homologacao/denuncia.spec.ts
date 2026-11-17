// tests/e2e/homologacao/denuncia.spec.ts
//
// Fluxo que GRAVA: denúncia de um perfil. O banco de teste é restaurado antes de cada teste.

import { expect, test } from '@playwright/test';
import { PERFIL_SEED, motivoParaPular } from '../support/ambiente';
import { resetarFixtures } from '../support/reset';

test.skip(motivoParaPular() !== null, motivoParaPular() ?? '');

// Os dois projetos (desktop e mobile) gravam no mesmo banco: nunca em paralelo.
test.describe.configure({ mode: 'serial' });

test.describe('denúncia de perfil (grava no banco de teste)', () => {
  test.beforeEach(async () => {
    await resetarFixtures();
  });

  test('botão fica bloqueado sem motivo e a denúncia é enviada com motivo', async ({ page }) => {
    await page.goto(`/denunciar/${PERFIL_SEED.id}`);

    const confirmar = page.getByRole('button', { name: 'Confirmar Denúncia' });
    await expect(confirmar).toBeDisabled();

    await page.getByPlaceholder(/descreva o problema/i).fill('Denúncia automática de teste (E2E).');
    await expect(confirmar).toBeEnabled();

    const gravacao = page.waitForResponse(
      (r) => r.url().includes('/rest/v1/denuncias') && r.request().method() === 'POST',
    );
    await confirmar.click();

    const resposta = await gravacao;
    expect(resposta.status(), 'a denúncia deve ser gravada (HTTP 201)').toBe(201);
    await expect(page.getByRole('heading', { name: /denúncia recebida/i })).toBeVisible();
  });

  test('texto só com espaços não habilita o envio', async ({ page }) => {
    await page.goto(`/denunciar/${PERFIL_SEED.id}`);
    await page.getByPlaceholder(/descreva o problema/i).fill('     ');
    await expect(page.getByRole('button', { name: 'Confirmar Denúncia' })).toBeDisabled();
  });
});
