import { BoardObject } from '@shared/lib/boards/types'
import { island, islandIdle, islandOn } from './islandStyles'

const CM_PRESETS = [2, 50] as const
const round1 = (n: number) => Math.round(n * 10) / 10

/** Isla derecha: inspector contextual (acciones de objeto o ajustes de fondo) + capas. */
export default function InspectorIsland({
  selectedIds,
  objects,
  selectedObj,
  backgroundType,
  squareCm,
  snap,
  layersOpen,
  onToggleLock,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  onEditIn,
  onDelete,
  onToggleBackground,
  onToggleSnap,
  onSetSquareCm,
  onToggleLayers,
}: {
  selectedIds: string[]
  objects: BoardObject[]
  selectedObj: BoardObject | null | undefined
  backgroundType: string
  squareCm: number
  snap: boolean
  layersOpen: boolean
  onToggleLock: () => void
  onDuplicate: () => void
  onBringToFront: () => void
  onSendToBack: () => void
  onEditIn: (dest: 'crop' | 'grid') => void
  onDelete: () => void
  onToggleBackground: () => void
  onToggleSnap: () => void
  onSetSquareCm: (n: number) => void
  onToggleLayers: () => void
}) {
  const allLocked = selectedIds.every((id) => objects.find((o) => o.id === id)?.locked)
  const isGrid = backgroundType === 'grid'
  return (
    <div className={`${island} right-3 top-3 flex flex-col gap-1 p-1.5 rounded-2xl w-[52px] items-center`}>
      {selectedIds.length ? (
        <>
          <button onClick={onToggleLock} title="Bloquear / Desbloquear" className={islandOn(allLocked)}>
            <span className="material-symbols-outlined text-[20px]">{allLocked ? 'lock' : 'lock_open'}</span>
          </button>
          <button onClick={onDuplicate} title="Duplicar (Ctrl+D)" className={islandIdle}>
            <span className="material-symbols-outlined text-[20px]">content_copy</span>
          </button>
          <button onClick={onBringToFront} title="Traer al frente" className={islandIdle}>
            <span className="material-symbols-outlined text-[20px]">flip_to_front</span>
          </button>
          <button onClick={onSendToBack} title="Enviar al fondo" className={islandIdle}>
            <span className="material-symbols-outlined text-[20px]">flip_to_back</span>
          </button>
          {selectedObj?.type === 'image' && (
            <>
              <button onClick={() => onEditIn('crop')} title="Editar en Recorte / Quitar fondo" className={islandIdle}>
                <span className="material-symbols-outlined text-[20px]">crop</span>
              </button>
              <button onClick={() => onEditIn('grid')} title="Medir en Cuadrícula" className={islandIdle}>
                <span className="material-symbols-outlined text-[20px]">grid_on</span>
              </button>
            </>
          )}
          <button onClick={onDelete} title="Borrar (Supr)" className={`${islandIdle} hover:!bg-red-500/15 hover:!text-red-500`}>
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </>
      ) : (
        <>
          <button onClick={onToggleBackground} title="Fondo: milimetrado / liso" className={islandOn(isGrid)}>
            <span className="material-symbols-outlined text-[20px]">grid_on</span>
          </button>
          <button onClick={onToggleSnap} disabled={!isGrid} title="Imán a la cuadrícula" className={islandOn(snap && isGrid)}>
            <span className="material-symbols-outlined text-[20px]">polyline</span>
          </button>
          {isGrid && (
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0.1}
                step={0.5}
                value={round1(squareCm)}
                onChange={(e) => onSetSquareCm(Number(e.target.value))}
                title="cm por cuadro"
                className="w-10 h-8 bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] rounded-md px-1 font-mono text-[11px] text-center text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)]"
              />
              {CM_PRESETS.map((preset) => {
                const active = Math.abs(squareCm - preset) < 0.01
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onSetSquareCm(preset)}
                    title={`Usar ${preset} cm por cuadro`}
                    className={`h-8 px-2 rounded-md border text-[10px] font-semibold transition-colors ${active ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'}`}
                  >
                    {preset} cm
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}
      <span className="h-px w-7 bg-[var(--color-outline-variant)]/60 my-0.5" />
      <button onClick={onToggleLayers} title="Capas" className={islandOn(layersOpen)}>
        <span className="material-symbols-outlined text-[20px]">layers</span>
      </button>
    </div>
  )
}
