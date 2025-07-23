import type { NextConfig } from "next";
// @ts-ignore
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";

const nextConfig:NextConfig = {
  devIndicators: false,
  experimental: {
      authInterrupts: true,
  },
  images:{
    remotePatterns:[
        {protocol: "https", hostname: "color-swap.s3.us-east-1.amazonaws.com"}
    ]
  },
  webpack: (config, { isServer }) => {
      if (isServer) {
          config.plugins = [...config.plugins, new PrismaPlugin()];
      }
      return config;
  },
};

export default nextConfig;
