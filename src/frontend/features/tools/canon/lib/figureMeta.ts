// Metadatos de las láminas de Canon. La tabla en sí vive en
// `@shared/lib/canon/plates` porque también la consume el board de Carnaval
// (`features/workspaces/*` no puede importar de `features/tools/*`). Este
// módulo se mantiene como punto de entrada de la herramienta: re-exporta el
// dato compartido y añade lo que solo usa la UI de Canon.

export {
  VIEWS,
  FIGURES,
  AVAILABLE_CANON_IDS,
  resolveCanonId,
  figureSrc,
  figureDims,
  type View,
  type Meta,
} from '@shared/lib/canon/plates'

/** Opción de canon para selects (id + nº cabezas + si tiene las 3 láminas). */
export interface CanonOption {
  id: string
  headCount: number
  /** Si tiene las 3 láminas. Los sin lámina se muestran marcados igual. */
  available?: boolean
}
