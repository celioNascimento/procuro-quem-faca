// tests/e2e/homologacao/conta.spec.ts
//
// Conta do usuário: /meus-dados (acesso e portabilidade), cadastro novo e exclusão de conta.
// Contas novas usam e-mail e2e-*@pqf-teste.invalid e são apagadas pelo reset.

import { expect, test } from '@playwright/test';
import { motivoParaPular } from '../support/ambiente';
import {
  aceitarDocumentosSeAparecer,
  dispensarAvisoDeCookies,
  entrarComCredenciais,
  entrarComoClienteEIrPara,
  exigirSomenteBancoDeTeste,
  vigiarSupabase,
} from '../support/entrar';
import { criarContaConfirmada, resetarFixtures } from '../support/reset';

test.skip(motivoParaPular() !== null, motivoParaPular() ?? '');
test.describe.configure({ mode: 'serial', timeout: 120_000 });

const SENHA_NOVA = 'Teste@1234';
const emailNovo = () => `e2e-${Date.now()}-${Math.floor(Math.random() * 1e4)}@pqf-teste.invalid`;

test.describe('conta do usuário (grava no banco de teste)', () => {
  test.beforeEach(async ({ page }) => {
    await resetarFixtures();
    await dispensarAvisoDeCookies(page);
  });

  test('/meus-dados sem login pede para entrar', async ({ page }) => {
    await page.goto('/meus-dados');
    await expect(page.getByRole('heading', { name: 'Entre na sua conta' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: /baixar meus dados/i })).toHaveCount(0);
  });

  test('/meus-dados logada mostra a conta e baixa a cópia em JSON', async ({ page }) => {
    await entrarComoClienteEIrPara(page, '/meus-dados');

    await expect(page.getByRole('heading', { name: 'Meus dados' })).toBeVisible();
    await expect(page.getByText('cliente@pqf-teste.invalid')).toBeVisible({ timeout: 30_000 });

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: /baixar meus dados/i }).click();
    expect((await download).suggestedFilename()).toMatch(/\.json$/i);
  });

  test('exclusão de conta: exige digitar EXCLUIR e apaga a conta nova', async ({ page }) => {
    const hosts = vigiarSupabase(page);
    // Conta já confirmada, criada só para este teste (o e-mail .invalid não recebe confirmação).
    const email = emailNovo();
    await criarContaConfirmada(email, SENHA_NOVA);
    await entrarComCredenciais(page, email, SENHA_NOVA);
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30_000 });

    await page.goto('/confirmar-exclusao');
    await aceitarDocumentosSeAparecer(page);

    const confirmar = page.getByRole('button', { name: 'CONFIRMAR EXCLUSÃO' });
    await expect(confirmar).toBeDisabled();
    await page.getByPlaceholder('Ex: Não encontrei clientes').fill('Teste automático (E2E).');
    await page.getByPlaceholder('EXCLUIR').fill('excluir');
    await expect(confirmar).toBeDisabled();

    await page.getByPlaceholder('EXCLUIR').fill('EXCLUIR');
    await expect(confirmar).toBeEnabled();
    await confirmar.click();

    await expect(page).toHaveURL(/\/login\?status=conta-excluida/, { timeout: 45_000 });
    exigirSomenteBancoDeTeste(hosts);
  });
});

// Cada cadastro novo faz o Supabase enviar um e-mail de confirmação, e o envio embutido tem limite
// baixíssimo por hora ("email rate limit exceeded"). Fica desligado até o projeto de teste ter SMTP
// próprio ou a confirmação de e-mail desativada. Para ligar: E2E_CADASTRO_NOVO=1.
test.describe('cadastro novo (desligado por padrão)', () => {
  test.skip(process.env.E2E_CADASTRO_NOVO !== '1', 'Cadastro novo desligado: limite de e-mails do Supabase de teste.');

  test.beforeEach(async ({ page }) => {
    await resetarFixtures();
    await dispensarAvisoDeCookies(page);
  });

  test('cadastro novo: e-mail desconhecido cria a conta e pede a confirmação por e-mail', async ({ page }) => {
    const hosts = vigiarSupabase(page);
    await entrarComCredenciais(page, emailNovo(), SENHA_NOVA);

    await expect(page.getByText(/^(Erro|Sucesso):/)).toContainText('Conta criada', { timeout: 30_000 });
    await expect(page).toHaveURL(/\/login/);
    exigirSomenteBancoDeTeste(hosts);
  });
});
