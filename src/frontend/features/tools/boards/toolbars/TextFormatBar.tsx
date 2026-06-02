import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider';
import { BoardObject, BOARD_FONTS, DEFAULT_FONT } from '@shared/lib/boards/types'

/** Barra de formato para texto y notas: fuente, tamaño, estilo, alineación y color. */
export default function TextFormatBar({
  o,
  patch,
}: {
  o: BoardObject
  patch: (p: Partial<BoardObject>) => void
}) {
  const { t } = usePreferences()
  const isSticky = o.type === 'sticky'
  const textColor = isSticky ? o.textColor || '#1f2937' : o.color || '#e8e8e8'
  const setTextColor = (v: string) => patch(isSticky ? { textColor: v } : { color: v })
  const tog = (active: boolean) =>
    `flex items-center justify-center w-9 h-9 rounded-md border transition-colors shrink-0 ${
      active
        ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] border-[var(--color-primary)]'
        : 'border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]'
    }`
  const swatch =
    'w-9 h-9 rounded-md border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] transition-colors relative overflow-hidden shrink-0'
  return (
    <div className="bg-[var(--color-surface-container-low)] border-b border-[var(--color-outline-variant)] shrink-0 px-4 py-2 flex items-center gap-2 overflow-x-auto whitespace-nowrap animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Fuente */}
      <select
        value={o.fontFamily || DEFAULT_FONT}
        onChange={(e) => patch({ fontFamily: e.target.value })}
        className="h-9 px-2 rounded-md bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] font-sans text-sm text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)]"
        title={t('boards.fontTip')}
        style={{ fontFamily: o.fontFamily || DEFAULT_FONT }}
      >
        {BOARD_FONTS.map((f) => (
          <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
            {f.label}
          </option>
        ))}
      </select>

      {/* Tamaño */}
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => patch({ fontSize: Math.max(8, (o.fontSize || 20) - 2) })} className={tog(false)} title={t('boards.minusTip')}>
          <span className="material-symbols-outlined text-[18px]">remove</span>
        </button>
        <input
          type="number"
          min={8}
          max={400}
          value={o.fontSize || 20}
          onChange={(e) => patch({ fontSize: Math.max(8, Math.min(400, Number(e.target.value) || 20)) })}
          className="w-14 h-9 bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] rounded-md px-2 font-mono text-sm text-center text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)]"
          title={t('boards.sizeTip')}
        />
        <button onClick={() => patch({ fontSize: Math.min(400, (o.fontSize || 20) + 2) })} className={tog(false)} title={t('boards.plusTip')}>
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
      </div>

      <span className="w-px h-6 bg-[var(--color-outline-variant)]/60 shrink-0" />

      {/* Negrita / Cursiva / Subrayado */}
      <button onClick={() => patch({ bold: !o.bold })} className={tog(!!o.bold)} title={t('boards.boldTip')}>
        <span className="material-symbols-outlined text-[18px]">format_bold</span>
      </button>
      <button onClick={() => patch({ italic: !o.italic })} className={tog(!!o.italic)} title={t('boards.italicTip')}>
        <span className="material-symbols-outlined text-[18px]">format_italic</span>
      </button>
      <button onClick={() => patch({ underline: !o.underline })} className={tog(!!o.underline)} title={t('boards.underlineTip')}>
        <span className="material-symbols-outlined text-[18px]">format_underlined</span>
      </button>

      <span className="w-px h-6 bg-[var(--color-outline-variant)]/60 shrink-0" />

      {/* Alineación */}
      <button onClick={() => patch({ align: 'left' })} className={tog(o.align === 'left' || !o.align)} title={t('boards.alignLeftTip')}>
        <span className="material-symbols-outlined text-[18px]">format_align_left</span>
      </button>
      <button onClick={() => patch({ align: 'center' })} className={tog(o.align === 'center')} title={t('boards.alignCenterTip')}>
        <span className="material-symbols-outlined text-[18px]">format_align_center</span>
      </button>
      <button onClick={() => patch({ align: 'right' })} className={tog(o.align === 'right')} title={t('boards.alignRightTip')}>
        <span className="material-symbols-outlined text-[18px]">format_align_right</span>
      </button>

      <span className="w-px h-6 bg-[var(--color-outline-variant)]/60 shrink-0" />

      {/* Color de texto */}
      <label className={swatch} title={t('boards.textColorTip')} style={{ background: textColor }}>
        <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="absolute inset-[-8px] w-16 h-16 cursor-pointer opacity-0" />
      </label>

      {/* Color de fondo (solo nota) */}
      {isSticky && (
        <label className={swatch} title={t('boards.noteColorTip')} style={{ background: o.color || '#FDE68A' }}>
          <input type="color" value={o.color || '#FDE68A'} onChange={(e) => patch({ color: e.target.value })} className="absolute inset-[-8px] w-16 h-16 cursor-pointer opacity-0" />
        </label>
      )}
    </div>
  )
}
