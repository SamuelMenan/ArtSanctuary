#!/usr/bin/env node
/**
 * Verificador de CONTRATOS entre código y documentación.
 *
 * Hermano de `check-docs-refs.mjs`, pero distinto en naturaleza: aquel busca
 * patrones de staleness (rutas pre-refactor, tools MCP fantasma); este compara
 * el código real contra lo que las tablas de `docs/` afirman, en ambos
 * sentidos.
 *
 * Existe porque la auditoría de 2026-08-13/14 encontró que TODOS sus bugs se
 * descubrieron de casualidad. Estos 4 checks los habrían cazado a los 3
 * segundos:
 *
 *   1. modelos ↔ architecture/data-model.md   → `isPublic` (era isPrivate),
 *      `entityId` (era artworkId), `discipline` (nunca existió), `metadata`
 *      (nunca existió), `title` en Board (era name).
 *   2. rutas   ↔ api/*.md                     → PATCH documentado siendo PUT,
 *      3 endpoints de Carnaval sin documentar.
 *   3. ficheros citados en docs               → 6 rutas `src/...` fantasma.
 *   4. 'use client' ↔ components-map.md       → 5 componentes con Tipo al revés.
 *
 * Gate estricto: sale con 1 si encuentra drift. Las excepciones legítimas van
 * a las allowlists de abajo, con motivo — nunca se silencia un check entero.
 *
 * Uso: node scripts/verify-docs-contracts.mjs  (o `npm run docs:verify`)
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'

/* ─────────────────────────── allowlists ─────────────────────────── */

/** Campos que toda interfaz Mongoose tiene y ningún doc lista (ruido). */
const IMPLICIT_MODEL_FIELDS = new Set(['_id', 'createdAt', 'updatedAt'])

/**
 * Rutas `src/...` citadas en docs que legítimamente no existen. Cada entrada
 * necesita motivo — si no lo tiene, es un bug que hay que arreglar, no
 * silenciar.
 */
const ALLOWED_MISSING_FILES = new Map([
  // (vacío por ahora — los 6 fantasmas actuales son bugs reales, W5 del plan)
])

/**
 * Componentes cuyo basename aparece más de una vez en src/frontend, o que el
 * doc menciona sin que sean un fichero real. Se saltan por ambigüedad, no por
 * estar bien.
 */
const AMBIGUOUS_COMPONENTS = new Set(['index.ts', 'types.ts', 'ui.ts'])

/* ─────────────────────────── utilidades ─────────────────────────── */

function walk(dir, filter, out = []) {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, filter, out)
    else if (filter(name)) out.push(p)
  }
  return out
}

const read = (p) => readFileSync(p, 'utf8')
const norm = (p) => p.replace(/\\/g, '/')

/** Quita markdown de una celda de tabla: `**client**` → client */
const cell = (s) => s.replace(/[`*_]/g, '').trim()

const problems = []
const record = (check, file, msg) => problems.push({ check, file, msg })

/* ───────────────── check 1: modelos ↔ data-model.md ───────────────── */

/**
 * Campos del modelo = claves top-level de la interfaz `export interface IX`.
 * Se usa la interfaz y no el `new Schema({...})` porque la interfaz es plana,
 * de una clave por línea, y es el contrato que consume el resto del código.
 */
function modelFields(src) {
  const m = src.match(/export interface I\w+ extends Document \{([\s\S]*?)\n\}/)
  if (!m) return null
  const fields = new Set()
  for (const line of m[1].split('\n')) {
    // Solo indentación 2 = top-level. Anidados (dimensions: { width... }) fuera.
    const f = line.match(/^ {2}(\w+)\??:/)
    if (f && !IMPLICIT_MODEL_FIELDS.has(f[1])) fields.add(f[1])
  }
  return fields
}

/** Campos que data-model.md documenta bajo `## \`ModelName\``. */
function documentedFields(doc, modelName) {
  const start = doc.indexOf(`## \`${modelName}\``)
  if (start === -1) return null
  const rest = doc.slice(start + 1)
  const nextH2 = rest.indexOf('\n## ')
  const section = nextH2 === -1 ? rest : rest.slice(0, nextH2)
  const fields = new Set()
  // Primera columna de tabla: | `campo` | ...
  for (const m of section.matchAll(/^\|\s*`(\w+)`\s*\|/gm)) fields.add(m[1])
  // Subdocumentos: se documentan como `### \`socials\`` / `### Subdocument \`socials\``
  // con un bloque de código, no como fila de tabla.
  for (const m of section.matchAll(/^#{3,4}\s+.*?`(\w+)`/gm)) fields.add(m[1])
  return fields
}

function checkModels() {
  const docPath = 'docs/architecture/data-model.md'
  if (!existsSync(docPath)) return record('modelos', docPath, 'no existe')
  const doc = read(docPath)

  for (const file of walk('src/backend/models', (n) => n.endsWith('.ts'))) {
    const name = basename(file, '.ts')
    const real = modelFields(read(file))
    if (!real) {
      record('modelos', norm(file), 'no se pudo parsear `export interface I… extends Document`')
      continue
    }
    const documented = documentedFields(doc, name)
    if (!documented) {
      record('modelos', docPath, `falta la sección \`## \\\`${name}\\\`\` (modelo existe en ${norm(file)})`)
      continue
    }
    for (const f of real) {
      if (!documented.has(f)) record('modelos', docPath, `${name}.${f} existe en el schema y NO está documentado`)
    }
    for (const f of documented) {
      if (!real.has(f)) record('modelos', docPath, `${name}.${f} está documentado pero NO existe en el schema`)
    }
  }
}

/* ───────────────── check 2: rutas ↔ api/*.md ───────────────── */

const HTTP = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

/** `src/app/api/artworks/[id]/interact/route.ts` → `/api/artworks/[id]/interact` */
function routePath(file) {
  return norm(file).replace(/^src\/app/, '').replace(/\/route\.ts$/, '')
}

/**
 * El segmento dinámico de users se llama `[username]` en disco pero recibe un
 * id, y los docs lo escriben `[id]` (quirk documentado en api/users.md).
 */
const normalizeRoute = (r) => r.replace('[username]', '[id]').replace('[vid]', '[id]')

function exportedMethods(src) {
  const found = new Set()
  for (const m of src.matchAll(/export\s+(?:const|async\s+function)\s+(GET|POST|PUT|PATCH|DELETE)\b/g)) {
    found.add(m[1])
  }
  return found
}

function checkRoutes() {
  const byDomain = new Map()
  for (const file of walk('src/app/api', (n) => n === 'route.ts')) {
    const rp = routePath(file)
    const domain = rp.split('/')[2] // /api/<domain>/...
    if (!byDomain.has(domain)) byDomain.set(domain, [])
    byDomain.get(domain).push({ file, rp: normalizeRoute(rp), methods: exportedMethods(read(file)) })
  }

  for (const [domain, routes] of byDomain) {
    const docPath = `docs/api/${domain}.md`
    // auth y upload no tienen doc propio por diseño (viven en architecture/auth.md
    // y features/upload.md). No es drift.
    if (!existsSync(docPath)) continue
    const doc = read(docPath)

    // Pares "MÉTODO ruta" que el doc afirma, sea en tabla o en heading.
    const claimed = new Set()
    for (const m of doc.matchAll(/^\|\s*([A-Z/]+)\s*\|\s*`([^`]+)`/gm)) {
      for (const meth of m[1].split('/')) if (HTTP.includes(meth)) claimed.add(`${meth} ${normalizeRoute(m[2])}`)
    }
    // Heading `## GET \`/api/x\`` y también `### \`GET /api/x\`` (ambos formatos
    // conviven en docs/api/).
    for (const m of doc.matchAll(/^#{2,4}\s+([A-Z]+)\s+`([^`]+)`/gm)) {
      if (HTTP.includes(m[1])) claimed.add(`${m[1]} ${normalizeRoute(m[2])}`)
    }
    for (const m of doc.matchAll(/^#{2,4}\s+`([A-Z]+)\s+([^`]+)`/gm)) {
      if (HTTP.includes(m[1])) claimed.add(`${m[1]} ${normalizeRoute(m[2])}`)
    }

    const real = new Set()
    for (const r of routes) for (const meth of r.methods) real.add(`${meth} ${r.rp}`)

    for (const pair of real) {
      if (!claimed.has(pair)) record('rutas', docPath, `${pair} existe en el código y NO está documentado`)
    }
    for (const pair of claimed) {
      if (!real.has(pair)) record('rutas', docPath, `${pair} está documentado pero NO existe en el código`)
    }
  }
}

/* ───────────────── check 3: ficheros citados que no existen ───────────────── */

/**
 * Solo aplica a docs que describen el estado ACTUAL. Se excluyen:
 *  - `historical/` — registro de lo que fue cierto.
 *  - `pr/` — planes; citan a propósito ficheros que aún no existen.
 *  - `resultados-verificacion.md` / `auditoria-estructura.md` — auditorías
 *    point-in-time, congeladas con la foto de su fecha.
 */
function isCurrentStateDoc(file) {
  const p = norm(file)
  if (p.includes('/historical/') || p.includes('/pr/')) return false
  return !/(resultados-verificacion|auditoria-estructura)\.md$/.test(p)
}

function checkFileRefs() {
  for (const file of walk('docs', (n) => n.endsWith('.md'))) {
    if (!isCurrentStateDoc(file)) continue
    const lines = read(file).split('\n')
    lines.forEach((line, i) => {
      for (const m of line.matchAll(/`(src\/[A-Za-z0-9_[\]./-]+\.(?:ts|tsx|mjs|css))`/g)) {
        const ref = m[1]
        if (ALLOWED_MISSING_FILES.has(ref)) continue
        if (!existsSync(ref)) record('ficheros', `${norm(file)}:${i + 1}`, `cita \`${ref}\` que no existe`)
      }
    })
  }
}

/* ───────────────── check 4: 'use client' ↔ components-map.md ───────────────── */

function checkClientDirective() {
  const docPath = 'docs/frontend/components-map.md'
  if (!existsSync(docPath)) return
  const doc = read(docPath)

  // Índice basename → rutas reales (para detectar ambigüedad).
  const index = new Map()
  for (const f of walk('src/frontend', (n) => /\.tsx?$/.test(n) && !n.includes('.test.'))) {
    const b = basename(f)
    if (!index.has(b)) index.set(b, [])
    index.get(b).push(f)
  }

  doc.split('\n').forEach((line, i) => {
    if (!line.startsWith('|')) return
    const cols = line.split('|').slice(1, -1).map(cell)
    if (cols.length < 2) return
    const name = cols[0]
    if (!/^[A-Za-z]+\.tsx?$/.test(name) || AMBIGUOUS_COMPONENTS.has(name)) return

    // La columna Tipo no está en posición fija (unas tablas tienen Ruta antes).
    const claimed = cols.slice(1).find((c) => c === 'client' || c === 'server')
    if (!claimed) return

    const matches = index.get(name)
    if (!matches) {
      record('use-client', `${docPath}:${i + 1}`, `documenta \`${name}\` que no existe en src/frontend`)
      return
    }
    if (matches.length > 1) return // ambiguo: mismo basename en varias rutas

    const isClient = /^\s*['"]use client['"]/.test(read(matches[0]))
    const real = isClient ? 'client' : 'server'
    if (real !== claimed) {
      record('use-client', `${docPath}:${i + 1}`, `${name} documentado como "${claimed}" pero es "${real}" (${norm(matches[0])})`)
    }
  })
}

/* ───────────────── check 5: ERD ↔ modelos ───────────────── */

/**
 * El ERD se promovió al índice como "verificado y vigente" cuando declaraba 4
 * de 7 entidades. Un diagrama incompleto que se presenta como completo engaña
 * más que no tenerlo.
 */
function checkErd() {
  const docPath = 'docs/architecture/diagramas/entidad-relacion-bd.md'
  if (!existsSync(docPath)) return
  // Solo el bloque ```mermaid — que la entidad se mencione en la prosa no
  // significa que esté dibujada.
  const fence = read(docPath).match(/```mermaid([\s\S]*?)```/)
  if (!fence) return record('erd', docPath, 'no tiene bloque ```mermaid')
  const diagram = fence[1].toUpperCase()
  for (const file of walk('src/backend/models', (n) => n.endsWith('.ts'))) {
    const model = basename(file, '.ts')
    // El ERD nombra entidades en mayúsculas y puede separar las palabras del
    // PascalCase con `_`: CarnivalProjectVersion → CARNIVAL_PROJECT_VERSION.
    const pattern = new RegExp(model.replace(/(?<!^)([A-Z])/g, '_?$1').toUpperCase())
    if (!pattern.test(diagram)) {
      record('erd', docPath, `el modelo ${model} no aparece como entidad en el diagrama`)
    }
  }
}

/* ─────────────────────────── run ─────────────────────────── */

checkModels()
checkRoutes()
checkFileRefs()
checkClientDirective()
checkErd()

const LABELS = {
  modelos: 'Modelos ↔ architecture/data-model.md',
  rutas: 'Rutas API ↔ docs/api/*.md',
  ficheros: 'Ficheros citados en docs',
  'use-client': "'use client' ↔ frontend/components-map.md",
  erd: 'ERD ↔ modelos existentes',
}

for (const key of Object.keys(LABELS)) {
  const group = problems.filter((p) => p.check === key)
  console.log(`\n── ${LABELS[key]} — ${group.length === 0 ? 'OK' : `${group.length} problema(s)`}`)
  for (const p of group) console.log(`   ${p.file}\n     ${p.msg}`)
}

console.log(`\nTOTAL: ${problems.length} desajuste(s) entre código y documentación`)
process.exit(problems.length > 0 ? 1 : 0)
