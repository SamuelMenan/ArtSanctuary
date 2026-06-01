import type { MutableRefObject } from 'react'
import { BoardObject } from '@shared/lib/boards/types'

const LAYER_NAMES: Record<string, string> = {
  image: 'Imagen', text: 'Texto', sticky: 'Nota',
  rect: 'Rectángulo', ellipse: 'Elipse', line: 'Línea', arrow: 'Flecha',
}
const LAYER_ICONS: Record<string, string> = {
  image: 'image', text: 'title', sticky: 'sticky_note_2',
  rect: 'rectangle', ellipse: 'circle', line: 'horizontal_rule', arrow: 'arrow_outward',
}
const layerLabel = (o: BoardObject) => o.name || LAYER_NAMES[o.type] || 'Capa'

/** Panel flotante de capas (tipo Photoshop): orden por arrastre, visibilidad, bloqueo y opacidad. */
export default function LayersPanel({
  objects,
  selectedIds,
  selectedObj,
  dragRef,
  onSelect,
  onClose,
  onMove,
  onToggleVisible,
  onToggleLock,
  onPatch,
}: {
  objects: BoardObject[]
  selectedIds: string[]
  selectedObj: BoardObject | null | undefined
  dragRef: MutableRefObject<string | null>
  onSelect: (id: string) => void
  onClose: () => void
  onMove: (dragId: string, targetId: string) => void
  onToggleVisible: (id: string) => void
  onToggleLock: (id: string) => void
  onPatch: (id: string, patch: Partial<BoardObject>) => void
}) {
  return (
    <div className="absolute bottom-4 right-4 w-64 max-h-[60%] bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] rounded-xl shadow-2xl flex flex-col z-30 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center justify-between px-3 h-10 border-b border-[var(--color-outline-variant)] shrink-0">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)]">Capas</span>
        <button onClick={onClose} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
      <ul className="flex-1 overflow-y-auto custom-scrollbar">
        {[...objects].sort((a, b) => b.z - a.z).map((o) => {
          const sel = selectedIds.includes(o.id)
          const hidden = o.visible === false
          return (
            <li
              key={o.id}
              draggable
              onDragStart={() => { dragRef.current = o.id }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragRef.current) onMove(dragRef.current, o.id); dragRef.current = null }}
              onClick={() => onSelect(o.id)}
              className={`group flex items-center gap-1.5 px-2 h-9 cursor-pointer border-l-2 ${
                sel ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]' : 'border-transparent hover:bg-[var(--color-surface-container-high)]'
              }`}
            >
              <span className="material-symbols-outlined text-[14px] text-[var(--color-on-surface-variant)]/40 cursor-grab">drag_indicator</span>
              <button onClick={(e) => { e.stopPropagation(); onToggleVisible(o.id) }} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] shrink-0" title={hidden ? 'Mostrar' : 'Ocultar'}>
                <span className="material-symbols-outlined text-[18px]">{hidden ? 'visibility_off' : 'visibility'}</span>
              </button>
              <span className={`material-symbols-outlined text-[16px] text-[var(--color-on-surface-variant)] shrink-0 ${hidden ? 'opacity-40' : ''}`}>{LAYER_ICONS[o.type]}</span>
              <input
                value={layerLabel(o)}
                onChange={(e) => onPatch(o.id, { name: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                className={`flex-1 min-w-0 bg-transparent text-xs text-[var(--color-on-surface)] outline-none truncate focus:text-[var(--color-primary)] ${hidden ? 'opacity-40' : ''}`}
              />
              <button onClick={(e) => { e.stopPropagation(); onToggleLock(o.id) }} className={`shrink-0 hover:text-[var(--color-primary)] ${o.locked ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)]/40 group-hover:text-[var(--color-on-surface-variant)]'}`} title={o.locked ? 'Desbloquear' : 'Bloquear'}>
                <span className="material-symbols-outlined text-[16px]">{o.locked ? 'lock' : 'lock_open'}</span>
              </button>
            </li>
          )
        })}
        {objects.length === 0 && (
          <li className="px-3 py-5 text-center text-[10px] font-mono uppercase tracking-widest text-[var(--color-on-surface-variant)]/60">Sin capas</li>
        )}
      </ul>
      {selectedObj && (
        <div className="border-t border-[var(--color-outline-variant)] px-3 py-2 shrink-0 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-[var(--color-on-surface-variant)]">opacity</span>
          <input type="range" min={0} max={100} value={selectedObj.opacity ?? 100} onChange={(e) => onPatch(selectedObj.id, { opacity: Number(e.target.value) })} className="flex-1 custom-range" />
          <span className="font-mono text-[10px] text-[var(--color-primary)] w-9 text-right">{selectedObj.opacity ?? 100}%</span>
        </div>
      )}
    </div>
  )
}
