/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Excluir chrome-aws-lambda del bundle de webpack
      config.externals = [...(config.externals || []), 'chrome-aws-lambda'];
    }
    return config;
  },
}

export default nextConfig
