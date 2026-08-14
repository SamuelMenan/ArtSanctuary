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
 *  - Docs que declaran una `Ubicación:`/base al inicio y luego usan rutas
 *    relativas cortas (ej. `boards.md`, `crop.md`) — el checker no entiende
 *    ese contexto y las marca igual. Triage humano, no auto-fix ciego.
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

let hits = 0
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    for (const re of [STALE_ROOT_PATH, PHANTOM_TOOL_RE]) {
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
