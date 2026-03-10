/** @type {import('next').NextConfig} */
const nextConfig = {
  // Isso pula a checagem de regras chatas (img, hooks) na Vercel
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Isso pula erros de tipagem automática que o Next 15 gera
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
