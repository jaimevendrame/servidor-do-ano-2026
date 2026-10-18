/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    // Roteia chamadas /api/:path* direto para o backend sem expor porta externa.
    const target = (process.env.INTERNAL_API_URL || 'http://api:3001').replace(/\/$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${target}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
