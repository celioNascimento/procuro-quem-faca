// tests/e2e/homologacao/perfil-publico.spec.ts
//
// Perfil público do prestador fictício e busca contra o banco de teste.
// Somente leitura: não grava nada.

import { expect, test } from '@playwright/test';
import { PERFIL_SEED, motivoParaPular } from '../support/ambiente';

test.skip(motivoParaPular() !== null, motivoParaPular() ?? '');

test.describe('perfil público e busca (dados fictícios)', () => {
  test('perfil mostra nome, abas Portfólio/Avaliações e link de denúncia', async ({ page }) => {
    await page.goto(`/${PERFIL_SEED.slug}`);

    await expect(page.getByRole('heading', { name: PERFIL_SEED.nome }).first()).toBeVisible();

    const secao = page.getByRole('region', { name: 'Portfólio e Avaliações' });
    await expect(secao).toBeVisible();

    const denunciar = page.getByRole('link', { name: /denunciar/i }).first();
    await expect(denunciar).toHaveAttribute('href', `/denunciar/${PERFIL_SEED.id}`);
  });

  test('busca por "pedreiro" encontra o prestador fictício', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('searchbox').or(page.getByRole('textbox', { name: /o que você procura/i })).first().fill('pedreiro');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/prestadores/);
    await expect(page.getByText(PERFIL_SEED.nome).first()).toBeVisible();
  });

  test('slug inexistente mostra a mensagem de perfil não encontrado', async ({ page }) => {
    // O perfil é carregado no navegador: a resposta HTTP é 200 e a tela avisa que não existe.
    await page.goto('/perfil-que-nao-existe-e2e');
    await expect(page.getByText(/perfil não encontrado/i).first()).toBeVisible();
  });
});
