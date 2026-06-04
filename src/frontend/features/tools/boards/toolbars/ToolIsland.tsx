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
    <div className={`${island} left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 p-1.5 rounded-2xl`} role="toolbar" aria-label={t('boards.toolsGroup')}>
      <button onClick={() => onTool('select')} title={t('boards.selectTip')} aria-label={t('boards.selectTip')} aria-pressed={tool === 'select'} className={islandOn(tool === 'select')}>
        <span className="material-symbols-outlined text-[20px]" aria-hidden>arrow_selector_tool</span>
      </button>
      <button onClick={() => onTool('hand')} title={t('boards.moveBoardTip')} aria-label={t('boards.moveBoardTip')} aria-pressed={tool === 'hand'} className={islandOn(tool === 'hand')}>
        <span className="material-symbols-outlined text-[20px]" aria-hidden>pan_tool</span>
      </button>
      <button onClick={() => onTool('measure')} title={t('boards.measureTip')} aria-label={t('boards.measureTip')} aria-pressed={tool === 'measure'} className={islandOn(tool === 'measure')}>
        <span className="material-symbols-outlined text-[20px]" aria-hidden>straighten</span>
      </button>
      <span className="h-px w-7 mx-auto bg-[var(--color-outline-variant)]/60 my-0.5" />
      <button onClick={onAddImage} title={t('boards.addImageTip')} aria-label={t('boards.addImageTip')} className={islandIdle}>
        <span className="material-symbols-outlined text-[20px]" aria-hidden>add_photo_alternate</span>
      </button>
      <button onClick={onAddText} title={t('boards.addTextTip')} aria-label={t('boards.addTextTip')} className={islandIdle}>
        <span className="material-symbols-outlined text-[20px]" aria-hidden>title</span>
      </button>
      <button onClick={onAddSticky} title={t('boards.addNoteTip')} aria-label={t('boards.addNoteTip')} className={islandIdle}>
        <span className="material-symbols-outlined text-[20px]" aria-hidden>sticky_note_2</span>
      </button>
      <button onClick={() => onAddShape('rect')} title={t('boards.addRectTip')} aria-label={t('boards.addRectTip')} className={islandIdle}>
        <span className="material-symbols-outlined text-[20px]" aria-hidden>rectangle</span>
      </button>
      <button onClick={() => onAddShape('ellipse')} title={t('boards.addEllipseTip')} aria-label={t('boards.addEllipseTip')} className={islandIdle}>
        <span className="material-symbols-outlined text-[20px]" aria-hidden>circle</span>
      </button>
      <button onClick={() => onAddShape('line')} title={t('boards.addLineTip')} aria-label={t('boards.addLineTip')} className={islandIdle}>
        <span className="material-symbols-outlined text-[20px]" aria-hidden>horizontal_rule</span>
      </button>
      <button onClick={() => onAddShape('arrow')} title={t('boards.addArrowTip')} aria-label={t('boards.addArrowTip')} className={islandIdle}>
        <span className="material-symbols-outlined text-[20px]" aria-hidden>arrow_outward</span>
      </button>
    </div>
  )
}
