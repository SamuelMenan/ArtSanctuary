#!/usr/bin/env node
/**
 * Detector de copy hardcodeado (plan-i18n-maestro).
 * Recorre src/frontend buscando literales con caracteres español en JSX o en
 * atributos de UI (title/placeholder/aria-label/alt). Imprime archivo:línea:texto
 * y un total. Objetivo de la migración: 0 hits.
 *
 * Uso: node scripts/find-hardcoded-strings.mjs [--all]
 *   --all  también lista comentarios/identificadores español (frente "código inglés").
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'src/frontend'
const SPANISH = /[áéíóúüñ¿¡]/i
// Palabras-stop frecuentes en español (para texto sin tildes).
const STOPWORDS = /\b(el|la|los|las|un|una|unos|unas|de|del|que|con|por|para|sin|sobre|tu|tus|sí|no|más|guardar|guardando|borrar|cambiar|enviar|subir|elige|sube)\b/i

const files = []
;(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const s = statSync(p)
    if (s.isDirectory()) walk(p)
    else if (/\.(tsx|ts)$/.test(name) && !/\.test\.tsx?$/.test(name)) files.push(p)
  }
})(ROOT)

let hits = 0
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return // comentarios
    if (/import\s|from\s+['"]/.test(trimmed)) return // imports
    // Texto JSX entre > y < , o en atributos title/placeholder/aria-label/alt.
    const jsxText = line.match(/>([^<>{}]*[A-Za-zÁÉÍÓÚÑ][^<>{}]*)</)
    const attr = line.match(/(?:title|placeholder|aria-label|alt)=["']([^"']+)["']/)
    const candidate = (jsxText?.[1] || attr?.[1] || '').trim()
    if (candidate && (SPANISH.test(candidate) || STOPWORDS.test(candidate))) {
      hits++
      console.log(`${file}:${i + 1}: ${candidate.slice(0, 80)}`)
    }
  })
}
console.log(`\nTOTAL: ${hits} posibles literales hardcodeados`)
process.exit(hits > 0 ? 1 : 0)
