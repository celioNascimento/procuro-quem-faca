// tests/e2e/homologacao/autenticacao.spec.ts
//
// Login com as contas fictícias. Não cria contas: a tela /login cria conta quando o
// e-mail não existe, então os testes usam SOMENTE e-mails já semeados.

import { expect, test } from '@playwright/test';
import { CONTAS, motivoParaPular } from '../support/ambiente';
import { entrar } from '../support/entrar';

test.skip(motivoParaPular() !== null, motivoParaPular() ?? '');

test.describe('autenticação (contas fictícias)', () => {
  test('prestador completo entra e cai em /dashboard com as abas do painel', async ({ page }) => {
    await entrar(page, 'prestador');

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('Meu painel')).toBeVisible();
    for (const aba of ['Meus Trabalhos', 'Desempenho', 'Divulgação', 'Dados Profissionais']) {
      await expect(page.getByRole('button', { name: aba }).first()).toBeVisible();
    }
  });

  test('senha errada de conta existente mostra erro e não entra', async ({ page }) => {
    await entrar(page, 'prestador', 'senha-errada-e2e');

    await expect(page.getByText(/incorretos/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('conta de cliente sem cadastro profissional completo vai para o cadastro', async ({ page }) => {
    await entrar(page, 'cliente');

    // Clara tem um registro de prestador "pendente": o destino é o cadastro.
    await expect(page).toHaveURL(/\/cadastro/);
  });

  test('mostrar/ocultar senha alterna o tipo do campo sem alterar o valor', async ({ page }) => {
    await page.goto('/login');
    const campo = page.getByPlaceholder('Mínimo 6 caracteres');
    await campo.fill(CONTAS.prestador.senha);
    await expect(campo).toHaveAttribute('type', 'password');

    await page.getByRole('button', { name: 'Mostrar senha' }).click();
    await expect(campo).toHaveAttribute('type', 'text');
    await expect(campo).toHaveValue(CONTAS.prestador.senha);
  });
});
