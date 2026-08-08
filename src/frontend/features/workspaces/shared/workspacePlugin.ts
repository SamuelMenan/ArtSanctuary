// Contrato de plugin de UI de un tipo de Workspace para la landing.
//
// La pantalla de Workspaces (selector de tipo, sub-opciones, cards de proyecto)
// es 100% data-driven: itera el registro y no menciona ningún tipo concreto.
// Agregar un tipo (Escultura, Personajes, Arte-Terapia) = registrar aquí su
// plugin; la landing lo muestra sola.

/** Metadatos de un proyecto, tal como los devuelve `/api/carnaval-projects`. */
export interface WorkspaceProjectMeta {
  _id: string
  /** Tipo de workspace/proyecto: 'libre' | 'carnaval' | ... */
  kind: string
  name: string
  modality?: string
  year: number
  accreditationStatus: 'draft' | 'review' | 'ready'
  updatedAt: string
}

/** Sub-opción a elegir tras seleccionar el tipo (p. ej. modalidades de Carnaval). */
export interface WorkspaceVariant {
  id: string
  label: string
  sublabel?: string
}

/** Presentación de la card de un proyecto en la rejilla. */
export interface WorkspaceCard {
  icon: string
  subtitle: string
  /** Clave i18n de una insignia de estado (opcional). */
  statusBadgeKey?: string
}

export interface WorkspaceUiPlugin {
  /** Id de tipo, coincide con `project.kind`: 'libre' | 'carnaval' | ... */
  id: string
  /** false = visible pero deshabilitado ("próximamente"). */
  enabled: boolean
  meta: { labelKey: string; descKey: string; icon: string }
  /** Sub-opciones tras elegir el tipo. Si se omite, se crea el proyecto directo. */
  variants?: () => WorkspaceVariant[]
  /** Crea un proyecto del tipo vía API; devuelve el `_id` para navegar. */
  createProject?: (variantId: string | null) => Promise<string>
  /** Cómo se pinta la card de un proyecto de este tipo. `t` traduce claves i18n. */
  card: (p: WorkspaceProjectMeta, t: (key: string) => string) => WorkspaceCard
}


/** Formato de fecha común para las cards (es). */
export function fmtWorkspaceDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
}
