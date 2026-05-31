'use client'

import AppShell from '@frontend/shared/layouts/AppShell'
import ToolActiveLayout from '@frontend/features/tools/shared/ToolActiveLayout'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { getMixLabels } from '../colorMixHelpers'
import { useColorMixer } from '../useColorMixer'
import MixControls from '../components/MixControls'
import PigmentStack from '../components/PigmentStack'
import ResultOrb from '../components/ResultOrb'
import MixHistory from '../components/MixHistory'
import PaletteDock from '../components/PaletteDock'

export default function ColorMixScreen() {
  const { locale } = usePreferences()
  const L = getMixLabels(locale === 'es')

  const {
    mediumId,
    medium,
    slots,
    history,
    savedPalette,
    copied,
    totalWeight,
    resultRgb,
    resultHex,
    cmyk,
    hsl,
    lab,
    muddy,
    textureBg,
    changeMedium,
    addPigment,
    removeSlot,
    setWeight,
    clearAll,
    copyHex,
    saveToPalette,
  } = useColorMixer()

  return (
    <AppShell>
      <ToolActiveLayout>
        {/* Top Control Bar */}
        <MixControls
          L={L}
          locale={locale}
          mediumId={mediumId}
          medium={medium}
          slotsCount={slots.length}
          changeMedium={changeMedium}
          clearAll={clearAll}
        />

        {/* Workspace */}
        <div className={`flex-1 bg-[var(--color-surface-container-lowest)] flex flex-col overflow-y-auto relative min-h-0 ${textureBg}`}>
          {/* Result + Pigments area */}
          <div className="flex-1 flex flex-col lg:flex-row gap-8 p-8 items-center justify-center min-h-[420px]">
            {/* Pigments stack */}
            <PigmentStack
              L={L}
              slots={slots}
              totalWeight={totalWeight}
              setWeight={setWeight}
              removeSlot={removeSlot}
            />

            {/* Result orb */}
            <ResultOrb
              L={L}
              resultRgb={resultRgb}
              resultHex={resultHex}
              cmyk={cmyk}
              hsl={hsl}
              lab={lab}
              muddy={muddy}
              copied={copied}
              slotsCount={slots.length}
              copyHex={copyHex}
              saveToPalette={saveToPalette}
            />
          </div>

          {/* History */}
          <MixHistory L={L} history={history} savedPalette={savedPalette} />

          {/* Palette dock */}
          <PaletteDock
            L={L}
            locale={locale}
            medium={medium}
            slots={slots}
            addPigment={addPigment}
          />
        </div>
      </ToolActiveLayout>
    </AppShell>
  )
}
