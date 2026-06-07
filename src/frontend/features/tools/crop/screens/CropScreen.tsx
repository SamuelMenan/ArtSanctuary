'use client'

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { useState } from 'react'
import CropTool from '@frontend/features/tools/crop/CropTool'
import CutoutTool from '@frontend/features/tools/crop/CutoutTool'

export default function CropScreen() {
  const { t } = usePreferences()
  const [tab, setTab] = useState<'crop' | 'cutout'>('crop')

  const tabClass = (active: boolean) =>
    `flex items-center gap-2 px-4 h-10 font-mono text-label-sm uppercase tracking-widest border-b-2 transition-colors ${
      active
        ? 'text-[var(--color-primary)] border-[var(--color-primary)]'
        : 'text-[var(--color-on-surface-variant)] border-transparent hover:text-[var(--color-primary)]'
    }`

  return (
    <>
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Pestañas */}
          <div className="bg-[var(--color-surface-container-low)] border-b border-[var(--color-outline-variant)] shrink-0 px-4 flex items-center gap-2">
            <button onClick={() => setTab('crop')} className={tabClass(tab === 'crop')}>
              <span className="material-symbols-outlined text-[18px]">crop</span>
              {t('crop.tabCrop')}
            </button>
            <button onClick={() => setTab('cutout')} className={tabClass(tab === 'cutout')}>
              <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
              {t('crop.tabCutout')}
            </button>
          </div>

          {tab === 'crop' ? <CropTool /> : <CutoutTool />}
        </div>
    </>
  )
}
