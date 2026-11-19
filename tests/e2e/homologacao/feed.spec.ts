// tests/e2e/homologacao/feed.spec.ts
//
// Feed de trabalhos concluídos, curtir e seguir (rede social de portfólios).
// A semente (supabase/homologacao/semente_feed.sql, já na base do reset) deixa UM trabalho no feed:
// "Reforma de varanda (finalizado)", do Pedro Pedreiro Teste, cliente Clara. Os outros trabalhos de semente
// ficam fora do feed (em execução). Cada teste começa do reset.

import { expect, test, type Page } from '@playwright/test';
import { CONTAS, PERFIL_SEED, motivoParaPular } from '../support/ambiente';
import { aceitarDocumentosSeAparecer, dispensarAvisoDeCookies, entrar, entrarComoClienteEIrPara } from '../support/entrar';
import { resetarFixtures } from '../support/reset';

test.skip(motivoParaPular() !== null, motivoParaPular() ?? '');
test.describe.configure({ mode: 'serial', timeout: 120_000 });

const TITULO_NO_FEED = 'Reforma de varanda (finalizado)';
const ID_NO_FEED = '22222222-2222-4222-8222-222222222222';
// UUID válido que não é de nenhuma cidade: o feed fica vazio para ele.
const CIDADE_SEM_TRABALHO = '00000000-0000-4000-8000-000000000000';

test.beforeEach(async ({ page }) => {
  await resetarFixtures();
  await dispensarAvisoDeCookies(page);
});

async function abrirFeed(page: Page, caminho = '/feed') {
  await page.goto(caminho);
  await expect(page.getByRole('heading', { name: 'Trabalhos concluídos' })).toBeVisible();
}

test.describe('feed: visitante', () => {
  test('vê o trabalho aceito, sem dado pessoal do cliente, e os trabalhos sem aceite não aparecem', async ({ page }) => {
    await abrirFeed(page);

    const cartoes = page.getByTestId('feed-card');
    await expect(cartoes).toHaveCount(1);
    await expect(cartoes.first().getByRole('heading', { name: TITULO_NO_FEED })).toBeVisible();
    await expect(cartoes.first().getByTestId('feed-prestador')).toContainText(CONTAS.prestador.nome);

    // Em execução e sem aceite não entram; nome do cliente nunca aparece.
    await expect(page.getByText('Muro de 10 metros')).toHaveCount(0);
    await expect(page.getByText('Projeto pronto para avaliação')).toHaveCount(0);
    await expect(page.getByText(CONTAS.cliente.nome)).toHaveCount(0);
  });

  test('curtir e seguir pedem login, com o link Entrar, e não gravam nada', async ({ page }) => {
    await abrirFeed(page);

    await page.getByTestId('feed-curtir').click();
    await expect(page.getByTestId('feed-aviso')).toContainText(/Entre na sua conta/);
    await expect(page.getByTestId('feed-aviso').getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login');
    await expect(page.getByTestId('feed-curtidas')).toHaveText('Seja o primeiro a curtir');

    await page.getByTestId('feed-seguir').click();
    await expect(page.getByTestId('feed-seguir')).toHaveAttribute('aria-pressed', 'false');
  });

  test('"Quem eu sigo" pede login', async ({ page }) => {
    await abrirFeed(page);
    await page.getByTestId('feed-aba-seguindo').click();
    await expect(page.getByTestId('feed-vazio')).toContainText(/Entre na sua conta/);
  });

  test('a home e o cabeçalho levam ao feed', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('home-link-feed').click();
    await expect(page).toHaveURL(/\/feed$/);

    // Em uma tela interna o cabeçalho tem o atalho; na página do feed ele some.
    await page.goto(`/${PERFIL_SEED.slug}`);
    await page.getByTestId('link-feed-header').click();
    await expect(page).toHaveURL(/\/feed$/);
    await expect(page.getByTestId('link-feed-header')).toHaveCount(0);
  });

  test('perfil público: Seguir mostra o aviso de login para visitante', async ({ page }) => {
    await page.goto(`/${PERFIL_SEED.slug}`);
    await expect(page.getByRole('heading', { name: PERFIL_SEED.nome }).first()).toBeVisible();
    await page.getByTestId('perfil-seguir').click();
    await expect(page.getByTestId('perfil-aviso')).toContainText(/Entre na sua conta/);
  });
});

test.describe('feed: filtro por cidade', () => {
  test('lista só cidades com trabalho, guarda a escolha no endereço e some a lista com cidade sem trabalho', async ({ page }) => {
    await abrirFeed(page);

    const cidade = page.getByTestId('feed-cidade');
    await expect(cidade.locator('option')).toHaveCount(2); // "Todas as cidades" + Londrina
    await expect(cidade.getByRole('option', { name: 'Londrina - PR' })).toHaveCount(1);

    await cidade.selectOption({ label: 'Londrina - PR' });
    await expect(page).toHaveURL(/[?&]cidade=[0-9a-f-]{36}/);
    await expect(page.getByTestId('feed-card')).toHaveCount(1);

    // Recarregar mantém o filtro.
    await page.reload();
    await expect(page.getByTestId('feed-cidade')).not.toHaveValue('');
    await expect(page.getByTestId('feed-card')).toHaveCount(1);
  });

  test('cidade sem trabalho explica e "Ver todos os trabalhos" limpa o filtro', async ({ page }) => {
    await abrirFeed(page, `/feed?cidade=${CIDADE_SEM_TRABALHO}`);
    await expect(page.getByTestId('feed-vazio')).toContainText(/Nenhum trabalho com esses filtros/);

    await page.getByTestId('feed-limpar-filtros').click();
    await expect(page).toHaveURL(/\/feed$/);
    await expect(page.getByTestId('feed-card')).toHaveCount(1);
  });

  test('link com filtro adulterado vira "sem filtro" e não quebra', async ({ page }) => {
    await abrirFeed(page, '/feed?cidade=abc&categoria=1%27%20or%201=1');
    await expect(page.getByTestId('feed-card')).toHaveCount(1);
  });
});

test.describe('feed: cliente logada', () => {
  test('curtir e seguir gravam e continuam depois de recarregar; deixar de seguir desfaz', async ({ page }) => {
    await entrarComoClienteEIrPara(page, '/feed');
    await expect(page.getByRole('heading', { name: 'Trabalhos concluídos' })).toBeVisible();

    await page.getByTestId('feed-curtir').click();
    await expect(page.getByTestId('feed-curtidas')).toHaveText('1 curtida');
    await page.getByTestId('feed-seguir').click();
    await expect(page.getByTestId('feed-seguir')).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await expect(page.getByTestId('feed-curtidas')).toHaveText('1 curtida');
    await expect(page.getByTestId('feed-seguir')).toHaveAttribute('aria-pressed', 'true');

    // A aba "Quem eu sigo" mostra o trabalho de quem ela segue.
    await page.getByTestId('feed-aba-seguindo').click();
    await expect(page.getByTestId('feed-card')).toHaveCount(1);

    // Deixar de seguir tira o trabalho dessa aba.
    await page.getByTestId('feed-seguir').click();
    await expect(page.getByTestId('feed-card')).toHaveCount(0);
    await expect(page.getByTestId('feed-vazio')).toBeVisible();
  });

  test('perfil público mostra Seguir com o total e o Curtir do modal do trabalho', async ({ page }) => {
    await entrarComoClienteEIrPara(page, `/${PERFIL_SEED.slug}`);
    await expect(page.getByRole('heading', { name: PERFIL_SEED.nome }).first()).toBeVisible();

    await expect(page.getByTestId('perfil-seguir')).toContainText('Seguir');
    await page.getByTestId('perfil-seguir').click();
    await expect(page.getByTestId('perfil-seguir')).toContainText('Seguindo');
    await expect(page.getByTestId('perfil-seguidores')).toContainText('1 seguidor');

    await page.reload();
    await expect(page.getByTestId('perfil-seguir')).toContainText('Seguindo');
    await expect(page.getByTestId('perfil-seguidores')).toContainText('1 seguidor');

    // Curtir dentro do modal do trabalho.
    await page.goto(`/${PERFIL_SEED.slug}?projeto=${ID_NO_FEED}`);
    await aceitarDocumentosSeAparecer(page);
    const curtir = page.getByTestId('modal-curtir');
    await expect(curtir).toBeVisible();
    await curtir.click();
    await expect(curtir).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('modal-curtidas-texto')).toHaveText('1');
  });

  test('Retirar do feed pede confirmação, é permanente e o trabalho some do feed', async ({ page }) => {
    await entrarComoClienteEIrPara(page, '/meus-servicos');

    const retirar = page.getByRole('button', { name: 'Retirar do feed' });
    await expect(retirar).toHaveCount(1); // só o trabalho finalizado e aceito no feed
    await retirar.click();

    const dialogo = page.getByRole('dialog', { name: 'Retirar do feed?' });
    await expect(dialogo).toContainText(/não volta/);
    await expect(dialogo).toContainText(/continua no perfil do prestador/);

    // "Voltar" não retira.
    await dialogo.getByRole('button', { name: 'Voltar' }).click();
    await expect(page.getByRole('button', { name: 'Retirar do feed' })).toHaveCount(1);

    await page.getByRole('button', { name: 'Retirar do feed' }).click();
    await page.getByRole('dialog', { name: 'Retirar do feed?' }).getByRole('button', { name: 'Sim, retirar' }).click();
    await expect(page.getByRole('button', { name: 'Retirar do feed' })).toHaveCount(0);

    // Sumiu do feed, mas continua no perfil do prestador.
    await abrirFeed(page);
    await expect(page.getByTestId('feed-card')).toHaveCount(0);
    await expect(page.getByTestId('feed-vazio')).toContainText(/Ainda não há trabalhos/);
    await page.goto(`/${PERFIL_SEED.slug}`);
    await expect(page.getByRole('heading', { name: PERFIL_SEED.nome }).first()).toBeVisible();
  });
});

test.describe('feed: prestador', () => {
  test('Mostrar no feed oculta e reexibe o trabalho, sem apagá-lo', async ({ page }) => {
    await entrar(page, 'prestador');
    await expect(page).toHaveURL(/\/dashboard/);
    await aceitarDocumentosSeAparecer(page);
    await page.getByRole('button', { name: 'Meus Trabalhos' }).first().click();

    const interruptor = page.getByTestId(`feed-switch-${ID_NO_FEED}`);
    await expect(interruptor).toBeVisible({ timeout: 20_000 });
    await expect(interruptor).toHaveAttribute('aria-checked', 'true');
    // Só o trabalho concluído e aceito no feed tem o interruptor.
    await expect(page.getByRole('switch', { name: /Mostrar no feed/ })).toHaveCount(1);

    await interruptor.click();
    await expect(interruptor).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByText(/Fora do feed. Continua no seu perfil/)).toBeVisible();

    await abrirFeed(page);
    await expect(page.getByTestId('feed-card')).toHaveCount(0);

    // Reexibir: volta ao feed.
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Meus Trabalhos' }).first().click();
    const de_novo = page.getByTestId(`feed-switch-${ID_NO_FEED}`);
    await expect(de_novo).toHaveAttribute('aria-checked', 'false', { timeout: 20_000 });
    await de_novo.click();
    await expect(de_novo).toHaveAttribute('aria-checked', 'true');

    await abrirFeed(page);
    await expect(page.getByTestId('feed-card')).toHaveCount(1);
  });

  test('no próprio perfil o prestador não vê Seguir nem Curtir', async ({ page }) => {
    await entrar(page, 'prestador');
    await expect(page).toHaveURL(/\/dashboard/);
    await aceitarDocumentosSeAparecer(page);

    await page.goto(`/${PERFIL_SEED.slug}?projeto=${ID_NO_FEED}`);
    await expect(page.getByRole('heading', { name: PERFIL_SEED.nome }).first()).toBeVisible();
    await expect(page.getByTestId('perfil-seguir')).toHaveCount(0);
    await expect(page.getByTestId('modal-curtir')).toHaveCount(0);
  });
});
