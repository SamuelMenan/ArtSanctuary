#!/usr/bin/env node
/**
 * Detector de la clase de bug que causó la auditoría de docs de 2026-08-13:
 * rutas de la estructura pre-refactor (`app/`, `components/`, `models/`,
 * `lib/` en la raíz en vez de bajo `src/`) y nombres de tools MCP que no
 * existen. No es un linter exhaustivo — es un grep dirigido a esos dos
 * patrones específicos. Falsos positivos esperados y aceptados:
 *  - `docs/historical/`, `changelog.md`, `auditoria-estructura.md`,
 *    `resultados-verificacion.md` — registro histórico/point-in-time, las
 *    rutas viejas ahí son la descripción correcta de lo que fue cierto en
 *    su momento, no un bug.
 *  - Docs que declaran una `Ubicación:` base al inicio y luego usan rutas
 *    relativas cortas (`components/`, `lib/`). Desde 2026-08-14 se detectan y
 *    se saltan automáticamente: sin eso el ruido crecía hasta 30 hits y un
 *    checker con 30 falsos positivos es un checker que nadie corre.
 *
 * Complemento: `npm run docs:verify` (verify-docs-contracts.mjs) compara
 * contratos reales (campos de modelo, métodos HTTP, existencia de ficheros)
 * en vez de patrones de texto.
 *
 * Uso: node scripts/check-docs-refs.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'docs'
const EXCLUDE_DIRS = new Set(['historical', 'node_modules'])
const EXCLUDE_FILES = new Set([
  'changelog.md',
  'auditoria-estructura.md',
  'resultados-verificacion.md',
])

// Rutas de código bajo backticks que empiezan por estas carpetas SIN `src/`
// delante — señal de referencia pre-refactor.
const STALE_ROOT_PATH = /`(app|components|models|lib)\//g

// Tools MCP citadas que no existen en mcp/index.ts (v3.0.0). Lista de
// denylist conocida + cualquier uso del prefijo `mcp:` (notación que nunca
// correspondió a una tool real).
const KNOWN_PHANTOM_TOOLS = [
  'view_file', 'write_doc', 'write_to_file', 'run_command',
  'list_api_endpoints', 'inspect_endpoint', 'inspect_data_model',
  'inspect_app_routing', 'list_components', 'inspect_component',
  'auto_document', 'inspect_i18n',
]
const PHANTOM_TOOL_RE = new RegExp(`\`(${KNOWN_PHANTOM_TOOLS.join('|')})\`|mcp:[a-z_]+`, 'g')

const files = []
;(function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (EXCLUDE_DIRS.has(name)) continue
    const p = join(dir, name)
    const s = statSync(p)
    if (s.isDirectory()) walk(p)
    else if (name.endsWith('.md') && !EXCLUDE_FILES.has(name)) files.push(p)
  }
})(ROOT)

/**
 * Un doc que declara su base (`> **Ubicación:** src/…`) usa después rutas
 * relativas a ella. Marcar esas rutas como "pre-refactor" es un falso positivo
 * sistemático, así que se salta el archivo entero para STALE_ROOT_PATH.
 */
const DECLARES_BASE = /^>?\s*\*\*Ubicaci[óo]n:?\*\*/m

/**
 * Los planes de `pr/` y el material de `helps/` están acotados a una feature y
 * escriben rutas relativas a ella (`components/Foo.tsx` = dentro de esa
 * feature). Mismo falso positivo que los docs con `Ubicación:` declarada.
 */
const SCOPED_DIR = /[\\/](pr|helps)[\\/]/

let hits = 0
for (const file of files) {
  const body = readFileSync(file, 'utf8')
  const relativeToBase = DECLARES_BASE.test(body) || SCOPED_DIR.test(file)
  const lines = body.split('\n')
  lines.forEach((line, i) => {
    const active = relativeToBase ? [PHANTOM_TOOL_RE] : [STALE_ROOT_PATH, PHANTOM_TOOL_RE]
    for (const re of active) {
      re.lastIndex = 0
      let m
      while ((m = re.exec(line))) {
        hits++
        console.log(`${file}:${i + 1}: ${m[0]} — ${line.trim().slice(0, 100)}`)
      }
    }
  })
}
console.log(`\nTOTAL: ${hits} referencias sospechosas en docs/`)
process.exit(hits > 0 ? 1 : 0)
