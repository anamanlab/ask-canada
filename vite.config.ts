import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import type { NextConfig } from "next";

type WebpackHook = NonNullable<NextConfig["webpack"]>;

export default defineConfig({
  plugins: [
    vinext({
      // Worker bundles do not need the Node standalone server. Load the shared
      // config after vinext loads .env.local so country aliases stay correct.
      nextConfig: async () => {
        const { default: nextConfig, WORKERS_RUNTIME_MODULE } = await import("./next.config");
        // next.config.ts aliases the Workers runtime module to a binding-less stub, because the Next.js
        // build (Vercel, containers) cannot resolve it. This build runs on Workers, where the module is real,
        // so drop that alias from both bundler configs vinext reads and let the runtime resolve it.
        const withoutWorkersStub = <T extends Record<string, unknown> | undefined>(alias: T): T => {
          if (!alias) return alias;
          const rest: Record<string, unknown> = { ...alias };
          delete rest[WORKERS_RUNTIME_MODULE];
          return rest as T;
        };
        return {
          ...nextConfig,
          output: undefined,
          turbopack: {
            ...nextConfig.turbopack,
            resolveAlias: withoutWorkersStub(nextConfig.turbopack?.resolveAlias),
          },
          // The stub has to be stripped after next.config's own webpack() has added it, not before.
          webpack: nextConfig.webpack
            ? (config: Parameters<WebpackHook>[0], options: Parameters<WebpackHook>[1]) => {
                const resolved = nextConfig.webpack!(config, options);
                return {
                  ...resolved,
                  resolve: { ...resolved.resolve, alias: withoutWorkersStub(resolved.resolve?.alias) },
                };
              }
            : undefined,
        } as unknown as import("vinext").NextConfig;
      },
    }),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});