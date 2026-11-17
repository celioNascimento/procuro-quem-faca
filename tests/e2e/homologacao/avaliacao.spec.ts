// tests/e2e/homologacao/avaliacao.spec.ts
//
// Fluxo que GRAVA: avaliação do cliente por link (token). Banco restaurado antes de cada teste.

import { expect, test } from '@playwright/test';
import { motivoParaPular } from '../support/ambiente';
import { PROJETO_EM_EXECUCAO_TOKEN } from '../support/fixtures';
import { resetarFixtures } from '../support/reset';

test.skip(motivoParaPular() !== null, motivoParaPular() ?? '');
test.describe.configure({ mode: 'serial' });

test.describe('avaliação por link (grava no banco de teste)', () => {
  test.beforeEach(async () => {
    await resetarFixtures();
  });

  test('só libera "Validar e concluir" depois de escolher a nota', async ({ page }) => {
    await page.goto(`/avaliar/${PROJETO_EM_EXECUCAO_TOKEN}`);
    const concluir = page.getByRole('button', { name: /validar e concluir/i });
    await expect(concluir).toBeVisible();
    await expect(concluir).toBeDisabled();

    await page.getByRole('button', { name: 'Dar 5 estrelas' }).click();
    await expect(concluir).toBeEnabled();
  });

  test('cliente avalia o serviço e vê o acompanhamento', async ({ page }) => {
    await page.goto(`/avaliar/${PROJETO_EM_EXECUCAO_TOKEN}`);

    await page.getByRole('button', { name: 'Dar 5 estrelas' }).click();
    await page.getByLabel(/seu depoimento/i).fill('Avaliação automática de teste (E2E).');
    await page.getByRole('button', { name: /^indico/i }).click();
    await page.getByRole('button', { name: /validar e concluir/i }).click();

    await expect(page.getByText('Acompanhamento e Garantia')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: /validar e concluir/i })).toHaveCount(0);
  });

  test('link de avaliação inexistente não mostra o formulário', async ({ page }) => {
    await page.goto('/avaliar/00000000-0000-4000-8000-00000000dead');
    await expect(page.getByRole('button', { name: /validar e concluir/i })).toHaveCount(0);
  });
});
