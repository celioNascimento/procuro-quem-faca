// tests/e2e/homologacao/avaliacao.spec.ts
//
// Fluxo que GRAVA: avaliação do cliente por link (token). A cliente de teste precisa estar
// logada (o banco só deixa o dono do projeto avaliar). Banco restaurado antes de cada teste.

import { expect, test } from '@playwright/test';
import { motivoParaPular } from '../support/ambiente';
import { dispensarAvisoDeCookies, entrarComoClienteEIrPara } from '../support/entrar';
import { PROJETO_PRONTO_TOKEN, TOKEN_INEXISTENTE } from '../support/fixtures';
import { resetarFixtures } from '../support/reset';

test.skip(motivoParaPular() !== null, motivoParaPular() ?? '');
test.describe.configure({ mode: 'serial' });

test.describe('avaliação por link (grava no banco de teste)', () => {
  test.beforeEach(async () => {
    await resetarFixtures();
  });

  test('sem login, o link não mostra o formulário', async ({ page }) => {
    await dispensarAvisoDeCookies(page);
    await page.goto(`/avaliar/${PROJETO_PRONTO_TOKEN}`);
    await expect(page.getByText(/carregando avaliação/i)).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByRole('button', { name: /validar e concluir/i })).toHaveCount(0);
  });

  test('logada, só libera "Validar e concluir" depois de escolher a nota', async ({ page }) => {
    await entrarComoClienteEIrPara(page, `/avaliar/${PROJETO_PRONTO_TOKEN}`);

    const concluir = page.getByRole('button', { name: /validar e concluir/i });
    await expect(concluir).toBeVisible({ timeout: 30_000 });
    await expect(concluir).toBeDisabled();

    await page.getByRole('button', { name: 'Dar 5 estrelas' }).click();
    await expect(concluir).toBeEnabled();
  });

  test('cliente avalia o serviço e vai para a tela de sucesso', async ({ page }) => {
    await entrarComoClienteEIrPara(page, `/avaliar/${PROJETO_PRONTO_TOKEN}`);

    await page.getByRole('button', { name: 'Dar 5 estrelas' }).click({ timeout: 30_000 });
    await page.getByLabel(/seu depoimento/i).fill('Avaliação automática de teste (E2E).');
    await page.getByRole('button', { name: /^indico/i }).click();
    await page.getByRole('button', { name: /validar e concluir/i }).click();

    await expect(page).toHaveURL(/\/sucesso/, { timeout: 30_000 });
  });

  test('token inexistente não abre o formulário', async ({ page }) => {
    await entrarComoClienteEIrPara(page, `/avaliar/${TOKEN_INEXISTENTE}`);
    await expect(page.getByText(/carregando avaliação/i)).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByRole('button', { name: /validar e concluir/i })).toHaveCount(0);
  });
});
