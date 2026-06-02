import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider';
import { BoardObject } from '@shared/lib/boards/types'
import { cmOf, pxOf } from '@shared/lib/measure'

const round1 = (n: number) => Math.round(n * 10) / 10

/** Pie de página: escala (cm/cuadro), recuento de objetos y campos X/Y/An/Al/∠ del objeto. */
export default function DimensionsFooter({
  squareCm,
  objectCount,
  selectedCount,
  selectedObj,
  readOnly,
  onPatch,
}: {
  squareCm: number
  objectCount: number
  selectedCount: number
  selectedObj: BoardObject | null | undefined
  readOnly: boolean
  onPatch: (patch: Partial<BoardObject>) => void
}) {
  const { t } = usePreferences()
  const dim =
    'w-16 h-7 bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] rounded px-1.5 font-mono text-[11px] text-center text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)]'
  const field = (label: string, value: number, set: (cm: number) => void, unit = 'cm') => (
    <label className="flex items-center gap-1 shrink-0">
      <span className="uppercase tracking-[0.08em]">{label}</span>
      <input
        type="number"
        step={0.1}
        value={round1(value)}
        onChange={(e) => set(Number(e.target.value) || 0)}
        className={dim}
      />
      <span className="opacity-60">{unit}</span>
    </label>
  )

  return (
    <div className="bg-[var(--color-surface-container)] border-t border-[var(--color-outline-variant)] shrink-0 px-4 py-1.5 flex items-center gap-4 overflow-x-auto whitespace-nowrap font-mono text-[10px] text-[var(--color-on-surface-variant)]">
      <span className="shrink-0">
        {t('boards.oneSquareEq', { n: round1(squareCm) })}
      </span>
      <span className="opacity-40">·</span>
      <span className="shrink-0">{objectCount} {objectCount === 1 ? t('boards.object') : t('boards.objects')}</span>
      {selectedCount > 1 && (
        <>
          <span className="opacity-40">·</span>
          <span className="shrink-0 text-[var(--color-primary)]">{selectedCount} {t('boards.selected')}</span>
        </>
      )}

      <div className="flex-1" />

      {!readOnly && selectedObj && (
        <div className="flex items-center gap-2.5 shrink-0">
          {field(t('boards.xAbbr'), cmOf(selectedObj.x), (cm) => onPatch({ x: pxOf(cm) }))}
          {field(t('boards.yAbbr'), cmOf(selectedObj.y), (cm) => onPatch({ y: pxOf(cm) }))}
          {field(t('boards.wAbbr'), cmOf(selectedObj.w), (cm) => onPatch({ w: Math.max(0, pxOf(cm)) }))}
          {field(t('boards.hAbbr'), cmOf(selectedObj.h), (cm) => onPatch({ h: Math.max(0, pxOf(cm)) }))}
          {field(t('boards.angleAbbr'), selectedObj.rotation || 0, (deg) => onPatch({ rotation: deg }), '°')}
        </div>
      )}
    </div>
  )
}
