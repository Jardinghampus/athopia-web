import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // tests/ innehåller byggda/minifierade fixtures och .claude/.github är
  // verktygskonfiguration — utan dessa dränktes 99 riktiga källkodsfel i
  // 3 408 träffar och lintningen var i praktiken oanvändbar.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".agents/**",
    ".claude/**",
    ".github/**",
    "tests/**",
  ]),
]);

export default eslintConfig;
