// tests/e2e/homologacao/selos-ouro-diamante.spec.ts
//
// Seguro (Ouro) e CND (Diamante): o prestador envia o comprovante, a equipe confere no painel admin e o selo
// aparece. Nenhuma consulta externa. O reset do banco apaga as verificações criadas aqui.

import { expect, test, type Page } from '@playwright/test';
import { motivoParaPular } from '../support/ambiente';
import { aceitarDocumentosSeAparecer, dispensarAvisoDeCookies, entrar, entrarComoAdmin } from '../support/entrar';
import { resetarFixtures } from '../support/reset';

test.skip(motivoParaPular() !== null, motivoParaPular() ?? '');
test.describe.configure({ mode: 'serial', timeout: 120_000 });

const PDF = { name: 'apolice.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 comprovante de teste') };

function daquiUmAno(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

async function abrirAba(page: Page, sub: 'seguro' | 'cnd') {
  await dispensarAvisoDeCookies(page);
  await entrar(page, 'prestador');
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
  await page.goto(`/dashboard?aba=perfil&sub=${sub}`);
  await aceitarDocumentosSeAparecer(page);
  await expect(page.getByTestId(`doc-${sub}`)).toBeVisible({ timeout: 20_000 });
}

test.describe('seguro e CND', () => {
  test.beforeEach(async () => {
    await resetarFixtures();
  });

  test('envio inválido é barrado na tela, antes de ir ao banco', async ({ page }) => {
    await abrirAba(page, 'seguro');
    await page.getByTestId('doc-seguro-enviar').click();
    await expect(page.getByRole('alert')).toContainText(/escolha o arquivo/i);

    await page.getByTestId('doc-seguro-arquivo').setInputFiles({ name: 'x.txt', mimeType: 'text/plain', buffer: Buffer.from('oi') });
    await page.getByTestId('doc-seguro-enviar').click();
    await expect(page.getByRole('alert')).toContainText(/PDF ou uma foto/i);

    await page.getByTestId('doc-seguro-arquivo').setInputFiles(PDF);
    await page.getByTestId('doc-seguro-enviar').click();
    await expect(page.getByRole('alert')).toContainText(/seguradora/i);
  });

  test('seguro: prestador envia, equipe aprova e o selo aparece com a validade', async ({ page, browser }) => {
    await abrirAba(page, 'seguro');
    await page.getByTestId('seguro-seguradora').fill('Seguradora Teste');
    await page.getByTestId('seguro-apolice').fill('AP-123456');
    await page.getByTestId('seguro-validade').fill(daquiUmAno());
    await page.getByTestId('doc-seguro-arquivo').setInputFiles(PDF);
    await page.getByTestId('doc-seguro-enviar').click();
    await expect(page.getByTestId('doc-seguro-fase-conferencia')).toBeVisible({ timeout: 30_000 });

    // Equipe: abre a fila de Seguro e CND, só aprova depois de informar a validade da apólice.
    const contexto = await browser.newContext();
    const admin = await contexto.newPage();
    await entrarComoAdmin(admin);
    await admin.goto('/admin/verificacoes');
    await admin.getByTestId('aba-admin-documentos').click();
    const cartao = admin.getByTestId('documento-card').filter({ hasText: 'Pedro Pedreiro Teste' });
    await expect(cartao).toContainText('Seguradora Teste', { timeout: 20_000 });
    await expect(cartao.getByTestId('documento-aprovar')).toBeDisabled();
    await cartao.getByTestId('documento-validade').fill(daquiUmAno());
    await cartao.getByTestId('documento-aprovar').click();
    await expect(cartao).toHaveCount(0, { timeout: 20_000 });
    await contexto.close();

    await page.reload();
    await expect(page.getByTestId('doc-seguro-fase-aprovado')).toContainText(/Válido até/, { timeout: 30_000 });
    await expect(page.getByTestId('conquista-seguro')).toContainText('Conquistado');
  });

  test('CND: equipe rejeita com motivo e o prestador vê o motivo e pode reenviar', async ({ page, browser }) => {
    await abrirAba(page, 'cnd');
    await page.getByTestId('doc-cnd-arquivo').setInputFiles({ ...PDF, name: 'cnd.pdf' });
    await page.getByTestId('doc-cnd-enviar').click();
    await expect(page.getByTestId('doc-cnd-fase-conferencia')).toBeVisible({ timeout: 30_000 });

    const contexto = await browser.newContext();
    const admin = await contexto.newPage();
    await entrarComoAdmin(admin);
    await admin.goto('/admin/verificacoes');
    await admin.getByTestId('aba-admin-documentos').click();
    const cartao = admin.getByTestId('documento-card').filter({ hasText: 'Pedro Pedreiro Teste' });
    await expect(cartao.getByTestId('documento-rejeitar')).toBeDisabled({ timeout: 20_000 });
    await cartao.getByTestId('documento-motivo').fill('Certidão ilegível');
    await cartao.getByTestId('documento-rejeitar').click();
    await expect(cartao).toHaveCount(0, { timeout: 20_000 });
    await contexto.close();

    await page.reload();
    await expect(page.getByRole('alert').filter({ hasText: 'Certidão ilegível' })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('doc-cnd-enviar')).toBeVisible();
  });
});
