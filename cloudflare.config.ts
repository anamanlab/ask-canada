import { bindings, defineConfig, defineWorker } from "cf/config";

// One config, two deployments — mirroring the repo's COUNTRY build variable.
// COUNTRY=ca builds Ask Canada (worker "canada"); COUNTRY=br builds Ask Brasil
// (worker "brazil"). They are separate Workers because COUNTRY is resolved at
// build time: the two apps share no code paths, only the repository.
const COUNTRY = (process.env.COUNTRY || "ca").replace(/[^a-z-]/g, "");
const isBrazil = COUNTRY === "br";

export default defineConfig({
  worker: defineWorker({
    name: isBrazil ? "brazil" : "canada",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-03",
    compatibilityFlags: ["nodejs_compat"],
    assets: { notFoundHandling: "none" },
    env: {
      ASSETS: bindings.assets(),
    },
  }),
});
