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
      // Excluir @sparticuz/chromium-min del bundle de webpack
      config.externals = [...(config.externals || []), '@sparticuz/chromium-min'];
    }
    return config;
  },
}

export default nextConfig
