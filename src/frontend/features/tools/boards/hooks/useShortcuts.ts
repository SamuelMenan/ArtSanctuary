import { useEffect } from 'react'

export interface ShortcutHandlers {
  readOnly: boolean
  onReadOnlyAttempt?: () => void
  /** Hay selección (para el guard de Supr/Backspace). */
  hasSelection: boolean
  onDelete: () => void
  onUndo: () => void
  onRedo: () => void
  onCopy: () => void
  onPaste: () => void
  onDuplicate: () => void
  onSelectAll: () => void
  onHandTool: () => void
  onSelectTool: () => void
  onMeasureTool: () => void
  onDrawTool?: () => void
  onEscape: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  onZoomToFit: () => void
  onZoomToSelection: () => void
  /** Mueve la selección (flechas). `big` = paso grande (Shift). */
  onNudge: (dx: number, dy: number) => void
  /** Abre/cierra la ayuda de atajos (tecla ?). */
  onHelp: () => void
}

/**
 * Atajos de teclado globales del lienzo (undo/redo, copiar/pegar/duplicar,
 * seleccionar todo, herramientas V/H/M, Escape). Ignora eventos en inputs.
 * `deps` controla cuándo re-suscribir para capturar closures frescas.
 */
export function useShortcuts(h: ShortcutHandlers, deps: unknown[]) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (h.readOnly) {
        h.onReadOnlyAttempt?.()
        return
      }
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const mod = e.ctrlKey || e.metaKey
      const k = e.key.toLowerCase()
      if ((e.key === 'Delete' || e.key === 'Backspace') && h.hasSelection) {
        e.preventDefault()
        h.onDelete()
      } else if (mod && k === 'z') {
        e.preventDefault()
        if (e.shiftKey) h.onRedo()
        else h.onUndo()
      } else if (mod && k === 'y') {
        e.preventDefault()
        h.onRedo()
      } else if (mod && k === 'c') {
        e.preventDefault()
        h.onCopy()
      } else if (mod && k === 'v') {
        e.preventDefault()
        h.onPaste()
      } else if (mod && k === 'd') {
        e.preventDefault()
        h.onDuplicate()
      } else if (mod && k === 'a') {
        e.preventDefault()
        h.onSelectAll()
      } else if (mod && (k === '=' || k === '+')) {
        e.preventDefault()
        h.onZoomIn()
      } else if (mod && (k === '-' || k === '_')) {
        e.preventDefault()
        h.onZoomOut()
      } else if (mod && k === '0') {
        e.preventDefault()
        h.onZoomReset()
      } else if (e.shiftKey && e.code === 'Digit1') {
        e.preventDefault()
        h.onZoomToFit()
      } else if (e.shiftKey && e.code === 'Digit2') {
        e.preventDefault()
        h.onZoomToSelection()
      } else if (k === '?' || (e.shiftKey && k === '/')) {
        e.preventDefault()
        h.onHelp()
      } else if (e.key.startsWith('Arrow')) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
        h.onNudge(dx, dy)
      } else if (!mod && k === 'h') {
        h.onHandTool()
      } else if (!mod && k === 'v') {
        h.onSelectTool()
      } else if (!mod && k === 'm') {
        h.onMeasureTool()
      } else if (!mod && k === 'p') {
        h.onDrawTool?.()
      } else if (e.key === 'Escape') {
        h.onEscape()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
