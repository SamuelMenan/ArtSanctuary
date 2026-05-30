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
  ]),

  // Frontera de capas: shared es puro, no importa de frontend/backend.
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@frontend/*", "@backend/*"],
              message:
                "shared es transversal y puro: no debe importar de @frontend ni @backend.",
            },
          ],
        },
      ],
    },
  },

  // backend no importa de frontend.
  {
    files: ["src/backend/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@frontend/*"],
              message: "El backend no debe importar de @frontend.",
            },
          ],
        },
      ],
    },
  },

  // Guardarraíl anti-monolitos (warn para no romper CI; subir a error por carpeta).
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "max-lines": [
        "warn",
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
      "max-lines-per-function": [
        "warn",
        { max: 120, skipBlankLines: true, skipComments: true },
      ],
    },
  },
]);

export default eslintConfig;
