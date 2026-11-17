// tests/e2e/homologacao/lgpd.spec.ts
//
// Páginas de conformidade (LGPD) carregam no ambiente de homologação.
// Somente leitura: os fluxos que gravam (pedido do titular, exclusão por link)
// entram na próxima etapa, com tokens semeados e reset de fixtures.

import { expect, test } from '@playwright/test';
import { motivoParaPular } from '../support/ambiente';

test.skip(motivoParaPular() !== null, motivoParaPular() ?? '');

test.describe('LGPD — páginas públicas', () => {
  test('/titular mostra o formulário de pedido do titular', async ({ page }) => {
    await page.goto('/titular');
    await expect(page.getByRole('heading', { name: 'Seus dados, sua decisão' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Política de Privacidade' })).toBeVisible();
  });

  test('/privacidade e /termos abrem sem erro', async ({ page }) => {
    for (const rota of ['/privacidade', '/termos']) {
      const resposta = await page.goto(rota);
      expect(resposta?.status(), `${rota} respondeu com erro`).toBeLessThan(400);
    }
  });
});
