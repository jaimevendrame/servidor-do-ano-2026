/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    // Se INTERNAL_API_URL estiver configurada (ex: em Docker sob o mesmo host/proxy),
    // redireciona chamadas /api/:path* direto para o backend sem expor porta externa.
    if (process.env.INTERNAL_API_URL) {
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.INTERNAL_API_URL.replace(/\/$/, '')}/api/:path*`,
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
