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
    // script one-off, fuera del repo (solo local)
    "scripts/reset_social.js",
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
      // Reglas experimentales del React Compiler (eslint-plugin-react-hooks v6):
      // no son de correctness y sobre-disparan en patrones válidos (carga de
      // datos en effects, refs en handlers). Como guía (warn), no error.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/static-components": "warn",
    },
  },

  // Guardarraíl para i18n: evitar copy hardcodeado en UI.
  // `ignoreProps: true` → solo vigila TEXTO visible (hijos JSX), no props como
  // className/type/aria (que disparaban ~1700 falsos positivos). El residual
  // está dominado por nombres de iconos Material Symbols renderizados como texto
  // (`<span className="material-symbols-outlined">icon</span>`); su fix real es
  // un componente <Icon name=…/> (los nombres pasan a prop, ignorada), no ampliar
  // esta allowlist. El resto del residual es copy genuino sin traducir (backlog i18n).
  {
    files: ["src/frontend/**/*.tsx"],
    rules: {
      "react/jsx-no-literals": ["warn", {
        "noStrings": true,
        "allowedStrings": ["·", "×", "—", "%", "cm", "px", "°", " ", "ELIMINAR", "ArtSanctuary"],
        "ignoreProps": true
      }]
    }
  }
]);

export default eslintConfig;
