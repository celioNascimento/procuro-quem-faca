export const NON_ADMIN_ROUTES = [
  '/',
  '/login',
  '/cadastro',
  '/recuperar-senha',
  '/quem-somos',
  '/ajuda',
  '/termos',
  '/privacidade',
  '/prestadores',
  '/reivindicar',
  '/not-found',
] as const;

export function isAdminPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export function isSafeNavigation(href: string | null) {
  // Controle sem href (botão, por exemplo) não navega: não há destino para vigiar.
  if (!href) return true;
  try {
    return !isAdminPath(new URL(href, 'http://localhost').pathname);
  } catch {
    return true;
  }
}
