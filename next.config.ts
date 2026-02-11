/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // PWA manifest references icon-192x192.png; serve favicon to avoid 404
      { source: "/icon-192x192.png", destination: "/favicon.png" },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tghhgiizryquthxodwbt.supabase.co",
        port: "",
        pathname: "/**",
      },
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  generateBuildId: () => String(Date.now()),
};

module.exports = nextConfig;
