'use client'

import { useRef, useState } from 'react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { ToolRow, ToolGrid, ToolPanelFooter } from '@frontend/features/tools/shared/workspace/ToolPanel'
import ToolCluster from '@frontend/features/tools/shared/workspace/ToolCluster'
import ToolButton from '@frontend/features/tools/shared/workspace/ToolButton'
import ToolSlider from '@frontend/features/tools/shared/workspace/ToolSlider'
import type { CanonOption } from '../lib/figureMeta'
import type { CanonPreset } from '../lib/presets'

const lbl = 'font-mono text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-[0.08em]'
const selectCls =
  'w-full min-w-0 bg-transparent border border-[var(--color-outline-variant)] rounded-lg px-2 h-9 text-[var(--color-primary)] font-mono text-label-sm cursor-pointer focus:outline-none focus:border-[var(--color-primary)]'

export interface CanonControlsProps {
  // Estudio
  refUrl: string | null
  refOpacity: number
  onRefFile: (file: File) => void
  onRefOpacity: (v: number) => void
  onClearRef: () => void
  measureActive: boolean
  onToggleMeasure: () => void
  onClearMeasure: () => void
  ghostCanonId: string | null
  onGhost: (id: string | null) => void
  ghostCanons: CanonOption[]
  helpMode: boolean
  onToggleHelp: () => void
  // Presets
  presets: CanonPreset[]
  presetId: string
  onLoadPreset: (id: string) => void
  onSavePreset: (name: string) => void
  onDeletePreset: (id: string) => void
  // Footer
  onSendToBoard: () => void
  compare: boolean
  onToggleCompare: () => void
  exporting: null | 'png' | 'pdf' | 'scale'
  onExport: (kind: 'png' | 'pdf' | 'scale') => void
}

/**
 * Panel lateral de Canon (estilo editor, sin scroll). Controles de estudio
 * (calco · regla · superponer · ayuda) y Presets; pie con enviar/comparar/
 * exports. Lámina y Capas viven en la barra superior (`CanonTopBar`). Mismos
 * primitivos que crop/grid.
 */
export default function CanonControls(p: CanonControlsProps) {
  const { t } = usePreferences()
  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')

  const savePreset = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    p.onSavePreset(trimmed)
    setName('')
  }

  return (
    <>
      <ToolCluster name={t('canon.study')}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          aria-label={t('canon.loadReference')}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) p.onRefFile(f)
            e.target.value = ''
          }}
        />
        <ToolRow>
          <ToolButton variant="ghost" icon="image" label={t('canon.loadReference')} onClick={() => fileRef.current?.click()} className="flex-1 min-w-0" />
          {p.refUrl && (
            <ToolButton variant="icon" icon="close" title={t('canon.clearReference')} onClick={p.onClearRef} />
          )}
        </ToolRow>
        {p.refUrl && (
          <ToolSlider icon="opacity" min={0} max={100} value={Math.round(p.refOpacity * 100)} suffix="%" onChange={(v) => p.onRefOpacity(v / 100)} />
        )}
        <ToolRow>
          <ToolButton variant="toggle" icon="straighten" label={t('canon.ruler')} active={p.measureActive} onClick={p.onToggleMeasure} className="flex-1 min-w-0" />
          {p.measureActive && (
            <ToolButton variant="icon" icon="close" title={t('canon.clearRuler')} onClick={p.onClearMeasure} />
          )}
        </ToolRow>
        <label className="flex flex-col gap-1">
          <span className={lbl}>{t('canon.superimpose')}</span>
          <select value={p.ghostCanonId ?? ''} onChange={(e) => p.onGhost(e.target.value || null)} className={selectCls}>
            <option value="">{t('canon.none')}</option>
            {p.ghostCanons.map((c) => (
              <option key={c.id} value={c.id}>{t(`canon.names.${c.id}`)}</option>
            ))}
          </select>
        </label>
        <ToolButton variant="toggle" icon="menu_book" label={t('canon.help.mode')} active={p.helpMode} onClick={p.onToggleHelp} className="w-full" />
      </ToolCluster>

      <ToolCluster name={t('canon.presets')}>
        <ToolRow>
          <select
            aria-label={t('canon.presets')}
            value={p.presetId}
            onChange={(e) => p.onLoadPreset(e.target.value)}
            className={`${selectCls} flex-1`}
          >
            <option value="">{p.presets.length ? t('canon.selectPreset') : t('canon.noPresets')}</option>
            {p.presets.map((pr) => (
              <option key={pr.id} value={pr.id}>{pr.name}</option>
            ))}
          </select>
          <ToolButton variant="icon" icon="delete" title={t('canon.deletePreset')} disabled={!p.presetId} onClick={() => p.presetId && p.onDeletePreset(p.presetId)} />
        </ToolRow>
        <ToolRow>
          <input
            value={name}
            aria-label={t('canon.presetName')}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && savePreset()}
            placeholder={t('canon.presetName')}
            className={`${selectCls} flex-1 placeholder:text-[var(--color-on-surface-variant)]/50`}
          />
          <ToolButton variant="icon" icon="bookmark_add" title={t('canon.savePreset')} disabled={!name.trim()} onClick={savePreset} />
        </ToolRow>
      </ToolCluster>

      <ToolPanelFooter>
        <div className="flex flex-col gap-2">
          <ToolRow>
            <ToolButton variant="ghost" icon="add_to_photos" label={t('canon.sendToBoard')} onClick={p.onSendToBoard} className="flex-1 min-w-0" />
            <ToolButton variant="toggle" icon={p.compare ? 'close_fullscreen' : 'compare'} label={t('canon.compare')} active={p.compare} onClick={p.onToggleCompare} className="flex-1 min-w-0" />
          </ToolRow>
          <ToolGrid cols={3}>
            <ToolButton variant="action" icon={p.exporting === 'png' ? 'hourglass_top' : 'image'} label="PNG" disabled={p.exporting !== null} onClick={() => p.onExport('png')} className="!px-1" />
            <ToolButton variant="action" icon={p.exporting === 'pdf' ? 'hourglass_top' : 'picture_as_pdf'} label="PDF" disabled={p.exporting !== null} onClick={() => p.onExport('pdf')} className="!px-1" />
            <ToolButton variant="action" icon={p.exporting === 'scale' ? 'hourglass_top' : 'straighten'} label="1:1" disabled={p.exporting !== null} onClick={() => p.onExport('scale')} className="!px-1" />
          </ToolGrid>
        </div>
      </ToolPanelFooter>
    </>
  )
}
