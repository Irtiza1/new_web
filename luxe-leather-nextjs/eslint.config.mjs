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
    "*.js",
    "scripts/**",
    "sqa*.js",
    "scratch*.js",
    "clean*.js",
    "patch_*.js",
    "seed_db.js",
    "test_pg.js",
    "verify_seed.js",
    "check_cms.js",
    "insert_*.js",
    "run_migration.js",
  ]),
  {
    rules: {
      "@next/next/no-img-element": "off",
      "@next/next/no-page-custom-font": "off"
    }
  }
]);

export default eslintConfig;
