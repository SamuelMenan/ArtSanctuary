import { island, islandIdle, islandOn } from './islandStyles'

type Tool = 'select' | 'hand' | 'measure'
type ShapeType = 'rect' | 'ellipse' | 'line' | 'arrow'

/** Isla izquierda: selección de herramienta (select/hand/measure) y creación de objetos. */
export default function ToolIsland({
  tool,
  onTool,
  onAddImage,
  onAddText,
  onAddSticky,
  onAddShape,
}: {
  tool: Tool
  onTool: (t: Tool) => void
  onAddImage: () => void
  onAddText: () => void
  onAddSticky: () => void
  onAddShape: (type: ShapeType) => void
}) {
  return (
    <div className={`${island} left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 p-1.5 rounded-2xl`}>
      <button onClick={() => onTool('select')} title="Seleccionar (V)" className={islandOn(tool === 'select')}>
        <span className="material-symbols-outlined text-[20px]">arrow_selector_tool</span>
      </button>
      <button onClick={() => onTool('hand')} title="Mover tablero (H · Espacio · botón central)" className={islandOn(tool === 'hand')}>
        <span className="material-symbols-outlined text-[20px]">pan_tool</span>
      </button>
      <button onClick={() => onTool('measure')} title="Medir distancia (M)" className={islandOn(tool === 'measure')}>
        <span className="material-symbols-outlined text-[20px]">straighten</span>
      </button>
      <span className="h-px w-7 mx-auto bg-[var(--color-outline-variant)]/60 my-0.5" />
      <button onClick={onAddImage} title="Añadir imagen" className={islandIdle}>
        <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
      </button>
      <button onClick={onAddText} title="Añadir texto" className={islandIdle}>
        <span className="material-symbols-outlined text-[20px]">title</span>
      </button>
      <button onClick={onAddSticky} title="Añadir nota" className={islandIdle}>
        <span className="material-symbols-outlined text-[20px]">sticky_note_2</span>
      </button>
      <button onClick={() => onAddShape('rect')} title="Rectángulo" className={islandIdle}>
        <span className="material-symbols-outlined text-[20px]">rectangle</span>
      </button>
      <button onClick={() => onAddShape('ellipse')} title="Elipse" className={islandIdle}>
        <span className="material-symbols-outlined text-[20px]">circle</span>
      </button>
      <button onClick={() => onAddShape('line')} title="Línea" className={islandIdle}>
        <span className="material-symbols-outlined text-[20px]">horizontal_rule</span>
      </button>
      <button onClick={() => onAddShape('arrow')} title="Flecha" className={islandIdle}>
        <span className="material-symbols-outlined text-[20px]">arrow_outward</span>
      </button>
    </div>
  )
}
