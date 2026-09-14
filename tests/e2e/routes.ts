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
  if (!href) return false;
  try {
    return !isAdminPath(new URL(href, 'http://localhost').pathname);
  } catch {
    return true;
  }
}
