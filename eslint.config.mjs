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
    // Temporary / scratch files:
    "tmp/**",
  ]),
  // Project-specific overrides.
  // Supabase does not generate TS types; Prisma schema is the source of truth.
  // Downgrade `no-explicit-any` to warning until we add type generation.
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }],
      "react/no-unescaped-entities": "warn",
      "@next/next/no-img-element": "warn",
    },
  },
]);

export default eslintConfig;
