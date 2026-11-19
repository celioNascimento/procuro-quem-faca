// tests/e2e/homologacao/selos-calculados.spec.ts
//
// Selos calculados pelo sistema (Etapa 2, Parte B): Experiência no PQF, Tempo de CNPJ, Atividade compatível
// e nível Prata. Pedro Pedreiro Teste (id 2) começa com CNPJ fictício em conferência; a aprovação vem do admin
// pelo banco de teste e as avaliações/datas são semeadas por funções do banco de teste (sem consulta externa).
// Regras: 10 serviços avaliados por 10 clientes diferentes (nota efetiva >= 3); tempo em faixas de 1, 3 e 5
// anos; CNAE 4399103 (alvenaria) casa com a categoria Pedreiro.
// ATENÇÃO: a semente já traz 1 avaliação válida do Pedro; por isso "N clientes no total" semeia N-1.

import { expect, test, type Page } from '@playwright/test';
import { CONTAS, PERFIL_SEED, motivoParaPular } from '../support/ambiente';
import { decidirCnpjComoAdmin } from '../support/admin';
import { aceitarDocumentosSeAparecer, dispensarAvisoDeCookies, entrar } from '../support/entrar';
import { resetarFixtures } from '../support/reset';
import { ajustarCnpj, haAnos, semearExperiencia } from '../support/selos';

test.skip(motivoParaPular() !== null, motivoParaPular() ?? '');
test.describe.configure({ mode: 'serial', timeout: 90_000 });

const TEXTO_EXPERIENCIA = 'Experiência no PQF: 10 serviços avaliados por 10 clientes diferentes';

test.describe('selos calculados no perfil público', () => {
  test.beforeEach(async ({ page }) => {
    await resetarFixtures();
    await dispensarAvisoDeCookies(page);
  });

  test('CNPJ com 4 anos e atividade de pedreiro: mostra tempo (3 anos) e atividade compatível, sem Prata', async ({ page, request }) => {
    await ajustarCnpj(PERFIL_SEED.id, haAnos(4), '4399103');
    await decidirCnpjComoAdmin(request, CONTAS.prestador.nome, 'aprovada');

    await page.goto(`/${PERFIL_SEED.slug}`);
    await expect(page.getByText('CNPJ aberto há mais de 3 anos')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Atividade registrada no CNPJ compatível com a categoria do perfil')).toBeVisible();
    await expect(page.getByText(/Nível Bronze/)).toBeVisible();
    await expect(page.getByText(/Experiência no PQF/)).toHaveCount(0);
  });

  test('CNAE principal de outra atividade, mas atividade secundária de pedreiro: mostra atividade registrada', async ({ page, request }) => {
    await ajustarCnpj(PERFIL_SEED.id, haAnos(2), '4321500', ['4399103']); // principal eletricista, secundária pedreiro
    await decidirCnpjComoAdmin(request, CONTAS.prestador.nome, 'aprovada');

    await page.goto(`/${PERFIL_SEED.slug}`);
    await expect(page.getByText('Atividade registrada no CNPJ compatível com a categoria do perfil')).toBeVisible({ timeout: 20_000 });
  });

  test('CNAE de outra atividade: não mostra "atividade compatível" (e não pune)', async ({ page, request }) => {
    await ajustarCnpj(PERFIL_SEED.id, haAnos(2), '4321500'); // eletricista, perfil é pedreiro
    await decidirCnpjComoAdmin(request, CONTAS.prestador.nome, 'aprovada');

    await page.goto(`/${PERFIL_SEED.slug}`);
    await expect(page.getByText('CNPJ aberto há mais de 1 ano')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Atividade registrada no CNPJ compatível/)).toHaveCount(0);
  });

  test('9 clientes no total não bastam: sem experiência e continua Bronze', async ({ page, request }) => {
    await semearExperiencia(PERFIL_SEED.id, 8); // + 1 da semente = 9
    await decidirCnpjComoAdmin(request, CONTAS.prestador.nome, 'aprovada');

    await page.goto(`/${PERFIL_SEED.slug}`);
    await expect(page.getByText(/Nível Bronze/)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Experiência no PQF/)).toHaveCount(0);
  });

  test('10 clientes diferentes com CNPJ ativo: Experiência no PQF e nível Prata', async ({ page, request }) => {
    await semearExperiencia(PERFIL_SEED.id, 9); // + 1 da semente = 10
    await decidirCnpjComoAdmin(request, CONTAS.prestador.nome, 'aprovada');

    await page.goto(`/${PERFIL_SEED.slug}`);
    await expect(page.getByTestId('nivel-perfil')).toHaveText('Nível Prata', { timeout: 20_000 });
    await expect(page.getByTestId('selo-cnpj-texto')).toContainText('CNPJ ativo, consultado em');
    await expect(page.getByText(TEXTO_EXPERIENCIA)).toBeVisible();
    // As avaliações semeadas não têm "indica": contam como "não indico" e passam de 30%, então a tag aparece.
    await expect(page.getByTestId('tag-nao-indicam')).toHaveText(/\d+% não indicam/);
  });

  test('serviços com nota 2 não contam (nota efetiva abaixo de 3)', async ({ page, request }) => {
    await semearExperiencia(PERFIL_SEED.id, 10, 2);
    await decidirCnpjComoAdmin(request, CONTAS.prestador.nome, 'aprovada');

    await page.goto(`/${PERFIL_SEED.slug}`);
    await expect(page.getByText(/Nível Bronze/)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Experiência no PQF/)).toHaveCount(0);
  });

  test('experiência não depende do CNPJ: aparece mesmo sem selo de CNPJ, e o nível continua vazio', async ({ page }) => {
    await semearExperiencia(PERFIL_SEED.id, 9);

    await page.goto(`/${PERFIL_SEED.slug}`);
    await expect(page.getByText(TEXTO_EXPERIENCIA)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Nível (Bronze|Prata)/)).toHaveCount(0);
  });
});

test.describe('barra de evolução do prestador', () => {
  test.beforeEach(async () => {
    await resetarFixtures();
  });

  async function abrirDados(page: Page) {
    await dispensarAvisoDeCookies(page);
    await entrar(page, 'prestador');
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
    await page.goto('/dashboard?aba=perfil&sub=cnpj');
    await aceitarDocumentosSeAparecer(page);
    await expect(page.getByTestId('evolucao-texto')).toBeVisible({ timeout: 20_000 });
  }

  test('mostra o andamento da experiência (7 de 10) e o que depende do CNPJ', async ({ page }) => {
    await semearExperiencia(PERFIL_SEED.id, 6); // + 1 da semente = 7
    await abrirDados(page);
    await expect(page.getByTestId('conquista-experiencia')).toContainText('7 de 10 clientes diferentes avaliaram seus serviços', { timeout: 20_000 });
    await expect(page.getByTestId('conquista-experiencia')).toContainText('Em andamento');
    await expect(page.getByTestId('conquista-tempo_cnpj')).toContainText('Depende do CNPJ');
  });

  test('com 10 clientes, a experiência aparece como conquistada', async ({ page }) => {
    await semearExperiencia(PERFIL_SEED.id, 9);
    await abrirDados(page);
    await expect(page.getByTestId('conquista-experiencia')).toContainText('Conquistado', { timeout: 20_000 });
    await expect(page.getByTestId('evolucao-texto')).toHaveText('1 de 4 selos conquistados');
  });
});
