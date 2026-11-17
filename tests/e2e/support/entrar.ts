// tests/e2e/support/entrar.ts
//
// Ajudantes de teste: login pela tela /login e vigia de requisições ao Supabase.

import { expect, type Page } from '@playwright/test';
import { CONTAS, SUPABASE_PRODUCAO_REF, SUPABASE_TESTE_REF, type Papel } from './ambiente';

/** Entra pela tela /login com e-mail e senha (a mesma que o usuário vê). */
export async function entrar(page: Page, papel: Papel, senhaOverride?: string) {
  const conta = CONTAS[papel];
  await page.goto('/login');
  await page.getByPlaceholder('seu@email.com').fill(conta.email);
  await page.getByPlaceholder('Mínimo 6 caracteres').fill(senhaOverride ?? conta.senha);
  await page.getByRole('button', { name: 'Entrar / Criar Conta' }).click();
}

/**
 * Registra todo host do Supabase tocado pela página. Use no início do teste e,
 * no fim, chame `exigirSomenteBancoDeTeste` para provar o isolamento.
 */
export function vigiarSupabase(page: Page) {
  const hosts = new Set<string>();
  page.on('request', (req) => {
    try {
      const { hostname } = new URL(req.url());
      if (hostname.endsWith('.supabase.co')) hosts.add(hostname);
    } catch {
      /* URL inválida: ignora */
    }
  });
  return hosts;
}

export function exigirSomenteBancoDeTeste(hosts: Set<string>) {
  const lista = [...hosts];
  expect(
    lista.some((h) => h.startsWith(SUPABASE_PRODUCAO_REF)),
    `a página falou com o banco de PRODUÇÃO: ${lista.join(', ')}`,
  ).toBe(false);
  for (const host of lista) {
    expect(host, 'host do Supabase inesperado').toBe(`${SUPABASE_TESTE_REF}.supabase.co`);
  }
}

/** Marca o aviso de cookies como já aceito (no celular ele cobre botões e atrapalha os cliques). */
export async function dispensarAvisoDeCookies(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('cookie_consent_aceito', 'true');
    } catch {
      /* sem storage: segue */
    }
  });
}

/**
 * Se a tela "Antes de continuar" (aceite de Termos e Privacidade) aparecer, aceita.
 * Chame depois de abrir a página que o usuário logado quer ver.
 */
export async function aceitarDocumentosSeAparecer(page: Page) {
  const dialogo = page.getByRole('dialog', { name: /antes de continuar/i });
  try {
    await dialogo.waitFor({ state: 'visible', timeout: 8_000 });
  } catch {
    return; // não apareceu: já aceito
  }
  // As caixas reais são escondidas (class "hidden"): clica no quadradinho visível de cada linha.
  for (const quadrado of await dialogo.locator('label > div').all()) {
    await quadrado.click();
  }
  await dialogo.getByRole('button', { name: 'Aceitar e continuar' }).click();
  await dialogo.waitFor({ state: 'hidden', timeout: 20_000 });
}

/** Login como cliente de teste já com cookies e aceite resolvidos, parando em `destino`. */
export async function entrarComoClienteEIrPara(page: Page, destino: string) {
  await dispensarAvisoDeCookies(page);
  await entrar(page, 'cliente');
  try {
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30_000 });
  } catch {
    // Diagnóstico: mostra o que a tela exibia quando o login não avançou.
    const texto = (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 400);
    throw new Error(`Login da cliente não saiu de ${page.url()}. Tela: "${texto}"`);
  }
  await page.goto(destino);
  await aceitarDocumentosSeAparecer(page);
}
