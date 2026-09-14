import { expect, test } from '@playwright/test';
import { NON_ADMIN_ROUTES, isAdminPath, isSafeNavigation } from './routes';

test.describe('controles documentáveis fora de /admin', () => {
  for (const route of NON_ADMIN_ROUTES) {
    test(`inspeciona controles visíveis em ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(isAdminPath(new URL(page.url()).pathname)).toBe(false);

      const controls = page.locator('button:visible, a:visible, [role="button"]:visible');
      const count = await controls.count();

      for (let index = 0; index < count; index += 1) {
        const control = controls.nth(index);
        const accessibleName = (await control.getAttribute('aria-label'))?.trim()
          || (await control.innerText()).trim()
          || (await control.getAttribute('title'))?.trim();
        expect(accessibleName, `controle ${index + 1} em ${route} sem nome acessível`).toBeTruthy();

        const href = await control.getAttribute('href');
        expect(isSafeNavigation(href), `controle em ${route} aponta para /admin`).toBe(true);
      }
    });
  }
});
