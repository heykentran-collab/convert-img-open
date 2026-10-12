import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/r2-explorer',
        destination: '/cloud-explorer',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
