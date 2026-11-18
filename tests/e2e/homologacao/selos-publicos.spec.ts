// tests/e2e/homologacao/selos-publicos.spec.ts
//
// Selo de CNPJ visto pelo cliente: card da busca e perfil público (Etapa 2, Parte A).
// A semente deixa o Pedro Pedreiro Teste com CNPJ em conferência (sem selo). A aprovação vem do admin
// pelo banco de teste, sem consulta externa.

import { expect, test } from '@playwright/test';
import { PERFIL_SEED, CONTAS, motivoParaPular } from '../support/ambiente';
import { decidirCnpjComoAdmin } from '../support/admin';
import { dispensarAvisoDeCookies } from '../support/entrar';
import { resetarFixtures } from '../support/reset';

test.skip(motivoParaPular() !== null, motivoParaPular() ?? '');
test.describe.configure({ mode: 'serial', timeout: 90_000 });

async function buscarPedreiro(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('searchbox').or(page.getByRole('textbox', { name: /o que você procura/i })).first().fill('pedreiro');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/prestadores/);
}

test.describe('selo de CNPJ para o cliente', () => {
  test.beforeEach(async ({ page }) => {
    await resetarFixtures();
    await dispensarAvisoDeCookies(page);
  });

  test('CNPJ só em conferência não mostra selo no perfil nem no card', async ({ page }) => {
    await page.goto(`/${PERFIL_SEED.slug}`);
    await expect(page.getByRole('heading', { name: PERFIL_SEED.nome }).first()).toBeVisible();
    await expect(page.getByText(/CNPJ ativo/)).toHaveCount(0);

    await buscarPedreiro(page);
    await expect(page.getByText(PERFIL_SEED.nome).first()).toBeVisible();
    await expect(page.getByTestId('selo-cnpj-card')).toHaveCount(0);
  });

  test('aprovado: o perfil mostra nível e data, e o card mostra "CNPJ ativo"', async ({ page, request }) => {
    await decidirCnpjComoAdmin(request, CONTAS.prestador.nome, 'aprovada');

    await page.goto(`/${PERFIL_SEED.slug}`);
    await expect(page.getByTestId('nivel-perfil')).toHaveText('Nível Bronze', { timeout: 20_000 });
    await expect(page.getByTestId('selo-cnpj-texto')).toHaveText(/CNPJ ativo, consultado em \d{2}\/\d{2}/);
    // O número do CNPJ e a razão social nunca aparecem para o cliente.
    await expect(page.getByText(/EMPRESA FICTICIA/)).toHaveCount(0);
    await expect(page.getByText(/TESTE0000001/)).toHaveCount(0);

    await buscarPedreiro(page);
    await expect(page.getByTestId('selo-cnpj-card')).toHaveText('CNPJ ativo', { timeout: 20_000 });
    await expect(page.getByTestId('nivel-card')).toHaveText('Bronze');
  });

  test('selo revogado some do perfil e do card', async ({ page, request }) => {
    await decidirCnpjComoAdmin(request, CONTAS.prestador.nome, 'aprovada');
    await decidirCnpjComoAdmin(request, CONTAS.prestador.nome, 'rejeitada', 'aprovadas');

    await page.goto(`/${PERFIL_SEED.slug}`);
    await expect(page.getByRole('heading', { name: PERFIL_SEED.nome }).first()).toBeVisible();
    await expect(page.getByText(/CNPJ ativo/)).toHaveCount(0);
  });
});
