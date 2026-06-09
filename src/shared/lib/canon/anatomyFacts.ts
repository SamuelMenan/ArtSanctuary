// Hechos anatómicos CONFIRMADOS para la capa de ayuda de Canon (plan §9).
// DATA pura: claves + cabezas + procedencia. El texto visible vive SOLO en i18n
// (`canon.help.*`); aquí no hay frases para no romper el escaneo de strings ni
// mezclar idioma con dato.
//
// Regla de veracidad (dura): cada hecho lleva `source`. Sin fuente no entra.
// Fuentes: Vitruvio (De Architectura III), Richer (Anatomie artistique, 1890),
// Loomis (Figure Drawing for All It's Worth), Bridgman, y antropometría
// (promedios medidos, p. ej. tablas NASA/DoD). Las cifras son RANGOS de
// enseñanza, no precisión falsa.

export type FactSource = 'vitruvio' | 'richer' | 'loomis' | 'bridgman' | 'anthropometry'

export interface AnatomyFact {
  /** Clave i18n (`canon.help.landmark.<key>` o `canon.help.rule.<key>`). */
  key: string
  /** Línea en el canon heroico de 8 cabezas (ideal de enseñanza). Opcional. */
  headsCanon?: number
  source: FactSource
}

/** Hecho por landmark (clave === clave del landmark en `landmarks.ts`).
 *  `headsCanon` = la línea ideal en el canon de 8 (Loomis/Richer). */
export const LANDMARK_FACTS: Record<string, AnatomyFact> = {
  cabeza: { key: 'cabeza', headsCanon: 1, source: 'loomis' },
  cuello: { key: 'cuello', source: 'richer' },
  hombros: { key: 'hombros', headsCanon: 1.3, source: 'loomis' },
  pecho: { key: 'pecho', headsCanon: 2, source: 'loomis' },
  ombligo: { key: 'ombligo', headsCanon: 3, source: 'richer' },
  entrepierna: { key: 'entrepierna', headsCanon: 4, source: 'richer' },
  rodillas: { key: 'rodillas', headsCanon: 6, source: 'loomis' },
  pantorrillas: { key: 'pantorrillas', headsCanon: 7, source: 'loomis' },
  pies: { key: 'pies', headsCanon: 8, source: 'loomis' },
}

/** Reglas cruzadas verificables ("trucos" de atelier). Se muestran en el modo
 *  "Anatomía explicada". */
export const CROSS_RULES: AnatomyFact[] = [
  { key: 'span', source: 'vitruvio' }, // envergadura ≈ estatura
  { key: 'pubisMid', source: 'anthropometry' }, // pubis ≈ mitad de la altura
  { key: 'elbowWaist', source: 'richer' }, // codo ≈ cintura / cresta ilíaca
  { key: 'wristCrotch', source: 'richer' }, // muñeca ≈ entrepierna / trocánter
  { key: 'fingersThigh', source: 'richer' }, // dedos ≈ mitad del muslo
  { key: 'footHead', source: 'richer' }, // pie ≈ 1 cabeza de largo
  { key: 'handFace', source: 'loomis' }, // mano ≈ largo de la cara
  { key: 'shoulders2', source: 'loomis' }, // hombros ≈ 2 cabezas (varón ideal)
]

/** Ficha por canon: solo la procedencia; el texto va en `canon.help.note.<id>`. */
export const CANON_NOTES: Record<string, { source: FactSource }> = {
  academic: { source: 'richer' },
  heroic: { source: 'loomis' },
  comic: { source: 'loomis' },
  'academic-female': { source: 'anthropometry' },
  'heroic-female': { source: 'loomis' },
  'comic-female': { source: 'loomis' },
}
