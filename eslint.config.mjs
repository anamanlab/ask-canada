import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "vendor/**",
    "design/**",
  ]),
  // Raw <img> where next/image doesn't apply: data-URL previews of what the person attached, map tiles
  // (hundreds of tiny third-party images positioned by hand, hidden when one fails to load) and the landing's
  // prebuilt SVG aurora ribbons (lazy, nothing to optimise).
  {
    files: [
      "src/components/chat/Composer.tsx",
      "src/components/chat/UserBubble.tsx",
      "src/components/ui/Map.tsx",
      "src/components/landing/Aurora.tsx",
    ],
    rules: { "@next/next/no-img-element": "off" },
  },
  // The error boundaries leave by a full page load on purpose (a clean start after a failure), and they ship
  // with every route, so they don't carry next/link.
  {
    files: ["src/app/error.tsx", "src/app/global-error.tsx"],
    rules: { "@next/next/no-html-link-for-pages": "off" },
  },
]);

export default eslintConfig;
