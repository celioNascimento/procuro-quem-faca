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
