/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
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