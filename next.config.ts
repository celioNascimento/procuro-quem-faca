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

const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: CABECALHOS_DE_SEGURANCA }];
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
