import 'server-only'
import { es } from './messages/es'
import { en } from './messages/en'
import type { Locale, TranslationDictionary } from './index'

// Mapa estático de diccionarios. SOLO servidor: el bundle de servidor puede
// incluir ambos idiomas sin coste para el cliente. Los Server Components leen
// el diccionario del idioma activo de aquí (síncrono).
const messages = { es, en } as const

export function getDictionary(locale: Locale): TranslationDictionary {
  return messages[locale]
}
