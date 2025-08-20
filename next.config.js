/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    domains: ['*'],
  },
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore TypeScript errors during build
  },
  eslint: {
    ignoreDuringBuilds: true, // Temporarily ignore ESLint errors during build
  },
}
