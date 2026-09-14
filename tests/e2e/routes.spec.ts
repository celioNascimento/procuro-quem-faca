import { expect, test } from '@playwright/test';
import { NON_ADMIN_ROUTES, isAdminPath } from './routes';

test.describe('rotas públicas fora de /admin', () => {
  for (const route of NON_ADMIN_ROUTES) {
    test(`carrega ${route} sem navegar para /admin`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page).not.toHaveURL(/\/admin(?:\/|$)/);
      expect(isAdminPath(new URL(page.url()).pathname)).toBe(false);
    });
  }
});
