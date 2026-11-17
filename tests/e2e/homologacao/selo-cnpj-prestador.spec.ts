// tests/e2e/homologacao/selo-cnpj-prestador.spec.ts
//
// Aba "CNPJ" em Dados Profissionais, do ponto de vista do prestador (Etapa 2, Parte A).
// A semente deixa o Pedro Pedreiro Teste com um CNPJ fictício em conferência. Nenhuma consulta
// externa: remover e validar o campo não chamam a Receita; a aprovação vem do admin pelo banco.

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import {
  CONTA_ADMIN,
  CONTAS,
  motivoParaPular,
  SUPABASE_TESTE_ANON_KEY,
  SUPABASE_TESTE_URL,
} from '../support/ambiente';
import { aceitarDocumentosSeAparecer, dispensarAvisoDeCookies, entrar } from '../support/entrar';
import { resetarFixtures } from '../support/reset';

test.skip(motivoParaPular() !== null, motivoParaPular() ?? '');
test.describe.configure({ mode: 'serial', timeout: 90_000 });

async function abrirAbaCnpj(page: Page) {
  await dispensarAvisoDeCookies(page);
  await entrar(page, 'prestador');
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
  await page.goto('/dashboard?aba=perfil&sub=cnpj');
  await aceitarDocumentosSeAparecer(page);
  await expect(page.getByRole('tab', { name: 'CNPJ' })).toHaveAttribute('aria-selected', 'true', { timeout: 20_000 });
}

async function aprovarComoAdmin(request: APIRequestContext) {
  const login = await request.post(`${SUPABASE_TESTE_URL}/auth/v1/token?grant_type=password`, {
    headers: { apikey: SUPABASE_TESTE_ANON_KEY, 'Content-Type': 'application/json' },
    data: { email: CONTA_ADMIN.email, password: CONTA_ADMIN.senha },
  });
  expect(login.ok(), await login.text()).toBe(true);
  const { access_token } = await login.json();
  const cabecalho = { apikey: SUPABASE_TESTE_ANON_KEY, Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' };
  const fila = await request.post(`${SUPABASE_TESTE_URL}/rest/v1/rpc/admin_fila_verificacoes`, { headers: cabecalho, data: { p_filtro: 'pendentes' } });
  expect(fila.ok()).toBe(true);
  const pedro = (await fila.json()).find((v: { prestador_nome: string }) => v.prestador_nome === CONTAS.prestador.nome);
  expect(pedro, 'pendência do Pedro na semente').toBeTruthy();
  const decide = await request.post(`${SUPABASE_TESTE_URL}/rest/v1/rpc/admin_decidir_verificacao`, {
    headers: cabecalho,
    data: { p_verificacao_id: pedro.verificacao_id, p_decisao: 'aprovada' },
  });
  expect(decide.ok(), await decide.text()).toBe(true);
}

test.describe('aba CNPJ do prestador', () => {
  test.beforeEach(async () => {
    await resetarFixtures();
  });

  test('CNPJ em conferência: mostra o número, a barra em 0 de 1 e o resto "em breve"', async ({ page }) => {
    await abrirAbaCnpj(page);
    await expect(page.getByTestId('cnpj-fase-conferencia')).toContainText('EMPRESA FICTICIA ALFA LTDA');
    await expect(page.getByTestId('evolucao-texto')).toHaveText('0 de 1 selo conquistado');
    await expect(page.getByText('Em breve')).toHaveCount(3);
    await expect(page.getByRole('progressbar', { name: /evolução dos selos/i })).toBeVisible();
    // Nunca fala em "perfil incompleto".
    await expect(page.getByText(/incompleto/i)).toHaveCount(0);
  });

  test('a aba "Meu perfil" continua com o formulário de sempre', async ({ page }) => {
    await abrirAbaCnpj(page);
    await page.getByRole('tab', { name: 'Meu perfil' }).click();
    await expect(page.getByRole('button', { name: 'Salvar alterações' })).toBeVisible({ timeout: 20_000 });
  });

  test('remover o CNPJ volta ao formulário; campo aplica máscara e barra número inválido sem chamar a rota', async ({ page }) => {
    await abrirAbaCnpj(page);
    await page.getByRole('button', { name: 'Remover meu CNPJ' }).click();
    await expect(page.getByRole('button', { name: 'Conferir meu CNPJ' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Remover meu CNPJ' })).toHaveCount(0);
    await expect(page.getByTestId('evolucao-texto')).toHaveText('0 de 1 selo conquistado');

    const campo = page.getByLabel('Número do CNPJ');
    await campo.fill('xxmvwcsz000143');
    await expect(campo).toHaveValue('XX.MVW.CSZ/0001-43');

    const chamadas: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('/api/cnpj') && r.method() === 'POST') chamadas.push(r.url());
    });
    await campo.fill('11222333000180');
    await page.getByRole('button', { name: 'Conferir meu CNPJ' }).click();
    await expect(page.locator('#erro-cnpj')).toContainText(/confira o número/i);
    expect(chamadas).toHaveLength(0);
  });

  test('depois da aprovação do admin a aba mostra o selo conquistado e a barra em 1 de 1', async ({ page, request }) => {
    await aprovarComoAdmin(request);
    await abrirAbaCnpj(page);
    await expect(page.getByTestId('cnpj-fase-aprovado')).toContainText(/CNPJ ativo, consultado em \d{2}\/\d{2}\/\d{4}/);
    await expect(page.getByTestId('evolucao-texto')).toHaveText('1 de 1 selo conquistado');
    await expect(page.getByRole('button', { name: 'Conferir meu CNPJ' })).toHaveCount(0);
  });
});
