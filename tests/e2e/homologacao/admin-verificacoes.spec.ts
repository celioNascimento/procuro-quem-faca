// tests/e2e/homologacao/admin-verificacoes.spec.ts
//
// Fila de revisão do CNPJ no painel admin (Etapa 2, Parte A).
// A semente tem duas verificações pendentes: Pedro Pedreiro Teste e Maria Eletricista Teste
// (CNPJs fictícios, situação ATIVA). Nenhuma consulta externa: tudo vem do banco de teste.

import { expect, test, type Page } from '@playwright/test';
import {
  CONTAS,
  motivoParaPular,
  SUPABASE_TESTE_ANON_KEY,
  SUPABASE_TESTE_URL,
} from '../support/ambiente';
import { entrarComoAdmin } from '../support/entrar';
import { resetarFixtures } from '../support/reset';

test.skip(motivoParaPular() !== null, motivoParaPular() ?? '');
test.describe.configure({ mode: 'serial', timeout: 90_000 });

const cartao = (page: Page, nome: string) =>
  page.getByTestId('verificacao-card').filter({ hasText: nome });

async function abrirFila(page: Page) {
  await entrarComoAdmin(page);
  await page.goto('/admin/verificacoes');
  await expect(page.getByRole('heading', { name: /verificações de cnpj/i })).toBeVisible({ timeout: 20_000 });
}

test.describe('fila de revisão de CNPJ (admin)', () => {
  test.beforeEach(async () => {
    await resetarFixtures();
  });

  test('lista as duas pendências com o motivo em português', async ({ page }) => {
    await abrirFila(page);
    await expect(page.getByTestId('verificacao-card')).toHaveCount(2);
    await expect(cartao(page, 'Pedro Pedreiro Teste')).toContainText('EMPRESA FICTICIA ALFA LTDA');
    await expect(cartao(page, 'Pedro Pedreiro Teste')).toContainText(/não é igual à razão social/i);
  });

  test('aprovar tira da fila e passa para "Aprovadas"', async ({ page }) => {
    await abrirFila(page);
    await cartao(page, 'Pedro Pedreiro Teste').getByRole('button', { name: 'Aprovar' }).click();
    await expect(cartao(page, 'Pedro Pedreiro Teste')).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByTestId('verificacao-card')).toHaveCount(1);
    await page.getByRole('button', { name: 'Aprovadas' }).click();
    await expect(cartao(page, 'Pedro Pedreiro Teste')).toContainText('Aprovada');
  });

  test('rejeitar com observação tira da fila e passa para "Rejeitadas"', async ({ page }) => {
    await abrirFila(page);
    const maria = cartao(page, 'Maria Eletricista Teste');
    await maria.getByLabel(/observação/i).fill('Documento não confere');
    await maria.getByRole('button', { name: 'Rejeitar' }).click();
    await expect(maria).toHaveCount(0, { timeout: 15_000 });
    await page.getByRole('button', { name: 'Rejeitadas' }).click();
    await expect(cartao(page, 'Maria Eletricista Teste')).toContainText('Rejeitada');
    // Rejeitada não oferece mais ações (o prestador precisa reenviar o CNPJ).
    await expect(cartao(page, 'Maria Eletricista Teste').getByRole('button')).toHaveCount(0);
  });

  test('revogar um selo aprovado o leva para "Rejeitadas"', async ({ page }) => {
    await abrirFila(page);
    await cartao(page, 'Pedro Pedreiro Teste').getByRole('button', { name: 'Aprovar' }).click();
    await expect(cartao(page, 'Pedro Pedreiro Teste')).toHaveCount(0, { timeout: 15_000 });
    await page.getByRole('button', { name: 'Aprovadas' }).click();
    await cartao(page, 'Pedro Pedreiro Teste').getByRole('button', { name: 'Revogar selo' }).click();
    await expect(cartao(page, 'Pedro Pedreiro Teste')).toHaveCount(0, { timeout: 15_000 });
    await page.getByRole('button', { name: 'Rejeitadas' }).click();
    await expect(cartao(page, 'Pedro Pedreiro Teste')).toContainText('Rejeitada');
  });

  test('quem não é admin é barrado pelo banco (42501), mesmo chamando a função direto', async ({ request }) => {
    const login = await request.post(`${SUPABASE_TESTE_URL}/auth/v1/token?grant_type=password`, {
      headers: { apikey: SUPABASE_TESTE_ANON_KEY, 'Content-Type': 'application/json' },
      data: { email: CONTAS.prestador.email, password: CONTAS.prestador.senha },
    });
    expect(login.ok(), await login.text()).toBe(true);
    const { access_token } = await login.json();
    const cabecalho = {
      apikey: SUPABASE_TESTE_ANON_KEY,
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    };

    const lista = await request.post(`${SUPABASE_TESTE_URL}/rest/v1/rpc/admin_fila_verificacoes`, {
      headers: cabecalho,
      data: { p_filtro: 'pendentes' },
    });
    expect(lista.ok()).toBe(false);
    expect((await lista.json()).code).toBe('42501');

    const decide = await request.post(`${SUPABASE_TESTE_URL}/rest/v1/rpc/admin_decidir_verificacao`, {
      headers: cabecalho,
      data: { p_verificacao_id: '00000000-0000-4000-8000-000000000000', p_decisao: 'aprovada' },
    });
    expect(decide.ok()).toBe(false);
    expect((await decide.json()).code).toBe('42501');
  });
});
