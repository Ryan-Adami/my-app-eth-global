import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  images: {},
  // webpack: (config) => {
  //   config.infrastructureLogging = {
  //     level: "verbose",
  //   };

  //   config.cache = {
  //     type: "memory",
  //   };

  //   return config;
  // },
};

export default process.env.ANALYZE === "true"
  ? withBundleAnalyzer()(nextConfig)
  : nextConfig;
