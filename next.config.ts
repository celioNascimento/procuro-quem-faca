/** @type {import('next').NextConfig} */
// Cabeçalhos de segurança em todas as rotas (varredura de 19/11). Sem CSP ainda: exige nonce nos scripts do Next
// e deve entrar primeiro em modo "report-only". Camera/geolocalização ficam liberadas só para o próprio site.
export const CABECALHOS_DE_SEGURANCA = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(self), payment=()' },
];

// CSP em duas camadas. (1) ENFORÇADA: só o que não quebra nada e fecha as portas mais perigosas (plugins, <base>
// sequestrado e embutir o site em outro site). (2) EM RELATÓRIO: a política completa de origens; só reporta
// (/api/csp-report → logs da Vercel), não bloqueia. Quando os relatórios ficarem limpos, a (2) vira enforçada
// e os 'unsafe-inline' saem com nonce (padrão de grandes empresas: observar antes de bloquear).
export const CSP_ENFORCADA = "object-src 'none'; base-uri 'self'; frame-ancestors 'none'";
export const CSP_EM_RELATORIO = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://ui-avatars.com https://*.googlesyndication.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://nominatim.openstreetmap.org https://vitals.vercel-insights.com https://va.vercel-scripts.com https://pagead2.googlesyndication.com",
  "frame-src https://googleads.g.doubleclick.net https://*.googlesyndication.com",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  'report-uri /api/csp-report',
].join('; ');

const nextConfig = {
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        ...CABECALHOS_DE_SEGURANCA,
        { key: 'Content-Security-Policy', value: CSP_ENFORCADA },
        { key: 'Content-Security-Policy-Report-Only', value: CSP_EM_RELATORIO },
      ],
    }];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // fotos do Google OAuth
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co', // uploads do Supabase Storage
      },
    ],
  },
};
export default nextConfig;
