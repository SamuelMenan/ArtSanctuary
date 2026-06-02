import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider';
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
  const { t } = usePreferences()
  return (
    <div className={`${island} left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 p-1.5 rounded-2xl`}>
      <button onClick={() => onTool('select')} title={t('boards.selectTip')} className={islandOn(tool === 'select')}>
        <span className="material-symbols-outlined text-[20px]">arrow_selector_tool</span>
      </button>
      <button onClick={() => onTool('hand')} title={t('boards.moveBoardTip')} className={islandOn(tool === 'hand')}>
        <span className="material-symbols-outlined text-[20px]">pan_tool</span>
      </button>
      <button onClick={() => onTool('measure')} title={t('boards.measureTip')} className={islandOn(tool === 'measure')}>
        <span className="material-symbols-outlined text-[20px]">straighten</span>
      </button>
      <span className="h-px w-7 mx-auto bg-[var(--color-outline-variant)]/60 my-0.5" />
      <button onClick={onAddImage} title={t('boards.addImageTip')} className={islandIdle}>
        <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
      </button>
      <button onClick={onAddText} title={t('boards.addTextTip')} className={islandIdle}>
        <span className="material-symbols-outlined text-[20px]">title</span>
      </button>
      <button onClick={onAddSticky} title={t('boards.addNoteTip')} className={islandIdle}>
        <span className="material-symbols-outlined text-[20px]">sticky_note_2</span>
      </button>
      <button onClick={() => onAddShape('rect')} title={t('boards.addRectTip')} className={islandIdle}>
        <span className="material-symbols-outlined text-[20px]">rectangle</span>
      </button>
      <button onClick={() => onAddShape('ellipse')} title={t('boards.addEllipseTip')} className={islandIdle}>
        <span className="material-symbols-outlined text-[20px]">circle</span>
      </button>
      <button onClick={() => onAddShape('line')} title={t('boards.addLineTip')} className={islandIdle}>
        <span className="material-symbols-outlined text-[20px]">horizontal_rule</span>
      </button>
      <button onClick={() => onAddShape('arrow')} title={t('boards.addArrowTip')} className={islandIdle}>
        <span className="material-symbols-outlined text-[20px]">arrow_outward</span>
      </button>
    </div>
  )
}
