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
    // Vendored Claude Code design skills (third-party, not app source).
    ".claude/**",
    // Generated-site starter template — a separate project, linted on its own.
    "studio/templates/**",
    // Local Studio working directory (job workspaces, screenshots, db).
    ".studio/**",
  ]),
]);

export default eslintConfig;
