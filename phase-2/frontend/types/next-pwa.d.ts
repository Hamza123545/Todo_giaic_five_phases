declare module "next-pwa" {
  import { NextConfig } from "next";

  interface PWAPluginOptions {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    runtimeCaching?: Array<{
      urlPattern: RegExp | string;
      handler?: string;
      method?: string;
      options?: {
        cacheName?: string;
        expiration?: {
          maxEntries?: number;
          maxAgeSeconds?: number;
        };
        networkTimeoutSeconds?: number;
        rangeRequests?: boolean;
      };
    }>;
  }

  function withPWA(options: PWAPluginOptions): (config: NextConfig) => NextConfig;

  export default withPWA;
}
