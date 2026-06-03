import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Aliases espejo de tsconfig paths para que los tests resuelvan @shared/@frontend/@backend.
const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@shared': r('./src/shared'),
      '@frontend': r('./src/frontend'),
      '@backend': r('./src/backend'),
    },
  },
})
