import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  // Increase file upload limits
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Allow up to 50MB file uploads
    },
  },
};

export default nextConfig;
