// Contrato de extensión del lienzo (Board) para tipos de Workspace.
//
// El motor `features/tools/boards` es agnóstico: NO conoce Carnaval ni ningún
// otro tipo. Solo conoce esta interfaz. Cada tipo de workspace que quiera
// dibujar sobre el lienzo (guías, alertas, inspector…) implementa una
// `BoardExtension` y la registra. El board resuelve la extensión por
// `workspace.kind` y renderiza sus slots.
//
// Dirección de dependencias: boards → (esta interfaz). workspaces/<tipo> →
// boards. NUNCA boards → workspaces/<tipo>.

import type { ComponentType, ReactNode } from 'react'
import type { BoardObject, BoardWorkspace, BoardWorkspaceKind } from '@shared/lib/boards/types'

/** Objeto a insertar por una extensión: el motor asigna `id` y `z`. */
export type NewBoardObject = Omit<BoardObject, 'id' | 'z'>

/**
 * Estado del board que se pasa a los slots de la extensión. Lo genérico que el
 * motor expone; los datos específicos del tipo (regla, vista) los deriva la
 * propia extensión a partir de `workspace` + su estado interno.
 */
export interface BoardExtSlotProps {
  boardId: string
  workspace: BoardWorkspace
  objects: BoardObject[]
  readOnly: boolean
  /** Zoom actual del escenario (para grosores/cotas independientes del zoom). */
  scale: number
  /** Desplazamiento del viewport (px de pantalla) — para grids que cubren el lienzo. */
  pos: { x: number; y: number }
  /** Tamaño del escenario (px) — para acotar grids al viewport. */
  stageSize: { w: number; h: number }
  /** cm por cuadro mayor de la grilla (para alinear elementos a la cuadrícula). */
  squareCm: number
  /** Espejado automático lateral (lateralIzq ↔ lateralDer). */
  lateralMirrorEnabled: boolean
  setLateralMirrorEnabled: (enabled: boolean) => void
  /** Inserta un objeto ya construido por la extensión (el motor pone id/z). */
  addObject: (obj: NewBoardObject) => void
  selectedIds: string[]
  patchSelected: (patch: Partial<BoardObject>) => void
}

/**
 * Extensión del lienzo para un tipo de workspace. Todos los slots son
 * opcionales: un tipo sin guías (p. ej. Arte-Terapia) simplemente no define
 * ninguno y el board se comporta como lienzo limpio.
 */
export interface BoardExtension {
  kind: BoardWorkspaceKind
  /**
   * Estado UI compartido entre `Layers` (Konva) y `Overlays` (HTML), que viven
   * en árboles de render distintos. El board envuelve ambos con este Provider.
   */
  Provider?: ComponentType<BoardExtSlotProps & { children: ReactNode }>
  /** Capa Konva dentro del stage (envolventes, huellas de base). */
  Layers?: ComponentType<BoardExtSlotProps>
  /** Overlays HTML sobre el lienzo (alertas, inspector, selector de vista). */
  Overlays?: ComponentType<BoardExtSlotProps>
  /**
   * Acciones de workspace para la sección inferior del rail derecho (p. ej. el
   * botón de Acreditación). Vive dentro del Provider, así comparte su estado UI.
   */
  WorkspaceActions?: ComponentType<BoardExtSlotProps>
  /**
   * Líneas-imán adicionales (en px de MUNDO) que el motor suma al snap de la
   * grilla al redimensionar (p. ej. los bordes de la guía reglamentaria de
   * Carnaval). `x` = verticales, `y` = horizontales.
   */
  snapLines?: (slot: BoardExtSlotProps) => { x: number[]; y: number[] }
  /**
   * cm/cuadro que el workspace impone a la cuadrícula del board (p. ej. Carnaval
   * lo deriva de las medidas para que las referencias calcen). El motor lo aplica
   * al fondo. `0`/ausente = sin imposición (lo controla el usuario).
   */
  gridSquareCm?: (slot: BoardExtSlotProps) => number
  /**
   * `true` si el workspace dibuja su propio grid (capa `Layers`) y el motor NO
   * debe pintar el grid uniforme (p. ej. el grid híbrido de Carnaval).
   */
  suppressBaseGrid?: (slot: BoardExtSlotProps) => boolean
}
