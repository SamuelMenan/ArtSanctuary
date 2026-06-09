'use client'

import { useRef, useState } from 'react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { ToolRow, ToolGrid, ToolPanelFooter } from '@frontend/features/tools/shared/workspace/ToolPanel'
import ToolCluster from '@frontend/features/tools/shared/workspace/ToolCluster'
import ToolButton from '@frontend/features/tools/shared/workspace/ToolButton'
import ToolSlider from '@frontend/features/tools/shared/workspace/ToolSlider'
import Select from '@frontend/shared/ui/Select'
import { UNITS, type Unit } from '@shared/lib/canon/units'
import { VIEWS, type View, type CanonOption } from '../lib/figureMeta'
import type { CanonPreset } from '../lib/presets'

const lbl = 'font-mono text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-[0.08em]'
// Input de texto con contraste sólido (mismo lenguaje que el Select compartido).
const inputCls =
  'w-full min-w-0 h-9 px-2.5 rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] font-mono text-[11px] focus:outline-none focus:border-[var(--color-primary)]'

export interface CanonControlsProps {
  // Lámina
  canonId: string
  onCanon: (id: string) => void
  canons: CanonOption[]
  height: number
  onHeight: (cm: number) => void
  view: View
  onView: (v: View) => void
  unit: Unit
  onUnit: (u: Unit) => void
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
}

/**
 * Panel lateral de Canon (estilo editor, sin scroll). Controles de estudio
 * clusters: Lámina (canon/vista/unidad/altura), Estudio (calco · regla ·
 * superponer), Presets; pie con enviar/comparar/exports. Las Capas viven en el
 * rail flotante del lienzo (`CanonLayersRail`). Mismos primitivos que crop/grid.
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
      <ToolCluster name={t('canon.plate')}>
        <label className="flex flex-col gap-1">
          <span className={lbl}>{t('canon.canon')}</span>
          <Select
            ariaLabel={t('canon.canon')}
            value={p.canonId}
            onChange={p.onCanon}
            options={p.canons.map((c) => ({ value: c.id, label: `${t(`canon.names.${c.id}`)}${c.available === false ? ` · ${t('canon.noPlate')}` : ''}` }))}
          />
        </label>
        <ToolGrid cols={2}>
          <label className="flex flex-col gap-1">
            <span className={lbl}>{t('canon.view')}</span>
            <Select ariaLabel={t('canon.view')} value={p.view} onChange={(v) => p.onView(v as View)} options={VIEWS.map((v) => ({ value: v, label: t(`canon.views.${v}`) }))} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={lbl}>{t('canon.unit')}</span>
            <Select ariaLabel={t('canon.unit')} value={p.unit} onChange={(v) => p.onUnit(v as Unit)} options={UNITS.map((un) => ({ value: un, label: t(`canon.units.${un}`) }))} />
          </label>
        </ToolGrid>
        <label className="flex flex-col gap-1">
          <span className={lbl}>{t('canon.totalHeight')}</span>
          <div className="flex h-9 items-center gap-1 rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-high)] px-2.5 focus-within:border-[var(--color-primary)]">
            <input
              type="number"
              aria-label={t('canon.totalHeight')}
              value={p.height}
              onChange={(e) => p.onHeight(Number(e.target.value))}
              className="min-w-0 flex-1 border-0 bg-transparent p-0 font-mono text-[11px] text-[var(--color-on-surface)] focus:outline-none appearance-none"
            />
            <span className={lbl}>cm</span>
          </div>
        </label>
      </ToolCluster>

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
          <Select
            ariaLabel={t('canon.superimpose')}
            value={p.ghostCanonId ?? ''}
            onChange={(v) => p.onGhost(v || null)}
            placeholder={t('canon.none')}
            options={p.ghostCanons.map((c) => ({ value: c.id, label: t(`canon.names.${c.id}`) }))}
          />
        </label>
      </ToolCluster>

      <ToolCluster name={t('canon.presets')}>
        <ToolRow>
          <Select
            ariaLabel={t('canon.presets')}
            className="flex-1"
            value={p.presetId}
            onChange={p.onLoadPreset}
            placeholder={p.presets.length ? t('canon.selectPreset') : t('canon.noPresets')}
            options={p.presets.map((pr) => ({ value: pr.id, label: pr.name }))}
          />
          <ToolButton variant="icon" icon="delete" title={t('canon.deletePreset')} disabled={!p.presetId} onClick={() => p.presetId && p.onDeletePreset(p.presetId)} />
        </ToolRow>
        <ToolRow>
          <input
            value={name}
            aria-label={t('canon.presetName')}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && savePreset()}
            placeholder={t('canon.presetName')}
            className={`${inputCls} flex-1 placeholder:text-[var(--color-on-surface-variant)]/50`}
          />
          <ToolButton variant="icon" icon="bookmark_add" title={t('canon.savePreset')} disabled={!name.trim()} onClick={savePreset} />
        </ToolRow>
      </ToolCluster>

      <ToolPanelFooter>
        <ToolRow>
          <ToolButton variant="ghost" icon="dashboard" label={t('tools.boards')} title={t('tools.sendBoards')} onClick={p.onSendToBoard} className="flex-1 min-w-[72px]" />
          <ToolButton variant="toggle" icon={p.compare ? 'close_fullscreen' : 'compare'} label={t('canon.compare')} active={p.compare} onClick={p.onToggleCompare} className="flex-1 min-w-0" />
        </ToolRow>
      </ToolPanelFooter>
    </>
  )
}
