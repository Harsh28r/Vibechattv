import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.camify.fun" }],
        destination: "https://camify.fun/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
