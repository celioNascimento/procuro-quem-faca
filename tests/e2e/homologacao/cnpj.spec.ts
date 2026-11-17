// tests/e2e/homologacao/cnpj.spec.ts
//
// Verificação de CNPJ do prestador (Etapa 2, Parte A): rota POST /api/cnpj.
// Grava no banco de TESTE (prestador_cnpj e prestador_verificacoes do prestador fictício).
// Consulta as fontes públicas de verdade (BrasilAPI, minhareceita, ReceitaWS): se todas estiverem
// fora do ar, o teste de consulta é pulado, para uma queda externa não derrubar o pipeline.

import { expect, test } from '@playwright/test';
import { motivoParaPular } from '../support/ambiente';
import { dispensarAvisoDeCookies, entrar } from '../support/entrar';
import { resetarFixtures } from '../support/reset';

test.skip(motivoParaPular() !== null, motivoParaPular() ?? '');
test.describe.configure({ mode: 'serial', timeout: 90_000 });

/** CNPJ real informado pelo dono para teste (empresa ativa, fonte pública). */
const CNPJ_REAL = '41.236.325/0001-55';

/** Exemplo do simulador da Receita (formato alfanumérico): válido, mas sem cadastro real. */
const CNPJ_SIMULADOR_VALIDO = 'XX.MVW.CSZ/0001-43';

test.describe('verificação de CNPJ (rota /api/cnpj)', () => {
  test.beforeEach(async ({ page }) => {
    await resetarFixtures();
    await dispensarAvisoDeCookies(page);
  });

  test('sem login, a rota recusa com 401', async ({ request }) => {
    const resposta = await request.post('/api/cnpj', { data: { cnpj: CNPJ_REAL } });
    expect(resposta.status()).toBe(401);
  });

  test('CNPJ inválido é recusado com 400 antes de qualquer consulta', async ({ page }) => {
    await entrar(page, 'prestador');
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
    const resposta = await page.request.post('/api/cnpj', { data: { cnpj: '11.222.333/0001-80' } });
    expect(resposta.status()).toBe(400);
    expect((await resposta.json()).erro).toMatch(/inválido/i);
  });

  test('CNPJ válido sem cadastro na Receita volta 422, sem gravar nada', async ({ page }) => {
    await entrar(page, 'prestador');
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
    const resposta = await page.request.post('/api/cnpj', { data: { cnpj: CNPJ_SIMULADOR_VALIDO } });
    // Se a fonte estiver fora do ar, a rota responde 503; nesse caso não há o que concluir.
    test.skip(resposta.status() === 503, 'Fontes públicas do CNPJ indisponíveis agora.');
    expect(resposta.status()).toBe(422);
  });

  test('CNPJ real é consultado nas fontes públicas e recebe aprovação ou fila', async ({ page }) => {
    await entrar(page, 'prestador');
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
    const resposta = await page.request.post('/api/cnpj', { data: { cnpj: CNPJ_REAL } });
    test.skip(resposta.status() === 503, 'Fontes públicas do CNPJ indisponíveis agora.');
    expect(resposta.status(), await resposta.text()).toBe(200);
    const corpo = await resposta.json();
    expect(['aprovada', 'pendente']).toContain(corpo.status);
    expect(typeof corpo.mensagem).toBe('string');
  });

  test('repetir a consulta do mesmo CNPJ pelo mesmo prestador não dá conflito', async ({ page }) => {
    await entrar(page, 'prestador');
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
    const primeira = await page.request.post('/api/cnpj', { data: { cnpj: CNPJ_REAL } });
    test.skip(primeira.status() === 503, 'Fontes públicas do CNPJ indisponíveis agora.');
    expect(primeira.status()).toBe(200);
    const segunda = await page.request.post('/api/cnpj', { data: { cnpj: CNPJ_REAL } });
    expect(segunda.status()).toBe(200);
  });
});
