'use client'

import { useRef, useState } from 'react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import Spinner from '@frontend/shared/ui/Spinner'
import { canvasToBlob, downloadBlob } from '@shared/lib/image/canvas'
import { NOTAN_THRESHOLD_DEFAULT, NOTAN_THRESHOLD_MAX, NOTAN_THRESHOLD_MIN, clampThreshold, notanFileName, type NotanMode } from '@shared/lib/image/notan'
import { useNotan } from '@frontend/features/tools/notan/hooks/useNotan'
import {
  NOTAN_ACCEPT_ATTR,
  canDownload,
  errorMessageKey,
  phaseMessageKey,
} from '@frontend/features/tools/notan/lib/notanState'

// Damero bajo el resultado: hace visibles las zonas transparentes (alfa).
const CHECKER = {
  backgroundImage:
    'linear-gradient(45deg, #80808033 25%, transparent 25%), linear-gradient(-45deg, #80808033 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #80808033 75%), linear-gradient(-45deg, transparent 75%, #80808033 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
} as const

const panelLabel =
  'bg-[var(--color-surface)] border border-[var(--color-outline-variant)] font-mono text-label-sm uppercase px-3 py-1'
const barButton =
  'flex items-center gap-[var(--spacing-stack-sm)] px-4 py-2 border font-mono text-label-sm uppercase whitespace-nowrap transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]'

export default function NotanPage() {
  const { t } = usePreferences()
  const [umbral, setUmbral] = useState(NOTAN_THRESHOLD_DEFAULT)
  const [tonoMedio, setTonoMedio] = useState(false)
  const mode: NotanMode = tonoMedio ? 3 : 2
  const valuesLabel = tonoMedio ? t('notan.threeValues') : t('notan.twoValues')

  const inputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { phase, errorCode, fileError, imageUrl, pixels, rendered, selectFile } = useNotan({
    threshold: umbral,
    mode,
    canvasRef,
  })
  const [downloadFailed, setDownloadFailed] = useState(false)

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Permite volver a elegir el mismo archivo.
    e.target.value = ''
    // Cancelar el diálogo no es un error: no cambia nada.
    if (!file) return
    setDownloadFailed(false)
    void selectFile(file)
  }

  const handleDownload = async () => {
    const canvas = canvasRef.current
    const params = rendered.current
    if (!canDownload(phase) || !canvas || !params) return
    setDownloadFailed(false)
    try {
      const blob = await canvasToBlob(canvas, 'image/png')
      downloadBlob(blob, notanFileName(params))
    } catch (err) {
      console.error('[notan] download failed', err)
      setDownloadFailed(true)
    }
  }

  // Un solo aviso visible: archivo rechazado > descarga fallida > error de carga/proceso.
  const alertCode = fileError ?? (downloadFailed ? 'download' : phase === 'error' ? errorCode : null)
  const statusKey = phaseMessageKey(phase)
  const downloadEnabled = canDownload(phase)

  return (
    <>
      {/* Top Control Bar */}
      {/* En móvil los grupos envuelven en varias filas (nada queda fuera de vista);
          desde md vuelve a ser una sola barra de la altura estándar. */}
      <div className="min-h-[var(--spacing-appbar-height)] py-2 md:py-0 md:h-[var(--spacing-appbar-height)] bg-[var(--color-surface-container)] border-b border-[var(--color-outline-variant)] flex flex-wrap md:flex-nowrap items-center gap-x-4 gap-y-2 px-[var(--spacing-grid-gutter)] justify-between shrink-0 z-10 md:overflow-x-auto">
        {/* Left Actions */}
        <div className="flex items-center">
          <input
            ref={inputRef}
            type="file"
            accept={NOTAN_ACCEPT_ATTR}
            className="hidden"
            aria-hidden
            tabIndex={-1}
            onChange={onFileChange}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={phase === 'loading'}
            className={`${barButton} border-[var(--color-outline)] text-[var(--color-on-background)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] disabled:opacity-50`}
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden>image</span>
            {imageUrl ? t('notan.changeImage') : t('notan.selectImage')}
          </button>
        </div>

        {/* Center Controls */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 md:px-4">
          {/* Slider Control */}
          <div className="flex items-center gap-4 w-56">
            <label className="font-mono text-label-sm uppercase text-[var(--color-secondary)] shrink-0" htmlFor="umbral-slider">
              {t('notan.threshold')}
            </label>
            <input
              className="flex-1 min-w-0 custom-range"
              id="umbral-slider"
              type="range"
              min={NOTAN_THRESHOLD_MIN}
              max={NOTAN_THRESHOLD_MAX}
              step={1}
              value={umbral}
              onChange={(e) => setUmbral(clampThreshold(Number(e.target.value)))}
            />
            <span className="font-mono text-label-sm text-[var(--color-on-background)] shrink-0 w-8 text-right tabular-nums" aria-hidden>
              {umbral}
            </span>
          </div>

          {/* Checkbox Control */}
          <div className="flex items-center gap-[var(--spacing-stack-sm)] cursor-pointer group">
            <div className="relative flex items-center">
              <input
                className="peer appearance-none w-4 h-4 border border-[var(--color-outline)] bg-transparent checked:bg-[var(--color-primary)] checked:border-[var(--color-primary)] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                id="tono-medio-check"
                type="checkbox"
                checked={tonoMedio}
                onChange={(e) => setTonoMedio(e.target.checked)}
              />
              <span className="material-symbols-outlined absolute text-[var(--color-on-primary)] text-[14px] pointer-events-none opacity-0 peer-checked:opacity-100 left-0 top-0 h-full w-full flex items-center justify-center" aria-hidden>check</span>
            </div>
            <label className="font-mono text-label-sm uppercase text-[var(--color-secondary)] group-hover:text-[var(--color-on-background)] transition-colors cursor-pointer select-none whitespace-nowrap" htmlFor="tono-medio-check">
              {t('notan.midTone')}
            </label>
          </div>
        </div>

        {/* Right: estado + descarga */}
        <div className="flex items-center gap-3">
          <span className="bg-[var(--color-secondary-container)] text-[var(--color-on-background)] font-mono text-label-sm uppercase px-3 py-1.5 rounded-full tracking-wider border border-[var(--color-outline-variant)] whitespace-nowrap">
            {valuesLabel}
          </span>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!downloadEnabled}
            title={t('notan.downloadTip')}
            className={`${barButton} bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[var(--color-outline)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden>download</span>
            {t('notan.download')}
          </button>
        </div>
      </div>

      {/* Avisos de error (archivo rechazado, carga, proceso, descarga) */}
      {alertCode && (
        <p role="alert" className="shrink-0 px-[var(--spacing-grid-gutter)] py-2 border-b border-[var(--color-error)] bg-[var(--color-error-container)] text-[var(--color-on-error-container)] font-sans text-sm">
          {t(errorMessageKey(alertCode))}
        </p>
      )}

      {/* Split Workspace Panels */}
      <div className="flex-1 flex flex-col md:flex-row bg-[var(--color-surface-container-lowest)] overflow-hidden min-h-0">
        {/* Left Panel: Original */}
        <div className="flex-1 relative min-h-[300px]">
          <div className="absolute top-[var(--spacing-grid-gutter)] left-[var(--spacing-grid-gutter)] z-10">
            <span className={`${panelLabel} text-[var(--color-secondary)]`}>{t('notan.original')}</span>
          </div>
          <div className="absolute inset-0 p-[var(--spacing-grid-gutter)] pt-16 flex items-center justify-center">
            {imageUrl ? (
              // URL local (blob:) del archivo elegido; se muestra sin efectos.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={t('notan.originalAlt')}
                className="max-w-full max-h-full object-contain pointer-events-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={phase === 'loading'}
                className="flex flex-col items-center gap-3 px-12 py-10 border border-dashed border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                <span className="material-symbols-outlined text-5xl" aria-hidden>add_photo_alternate</span>
                <span className="font-mono text-label-sm uppercase tracking-widest">{t('notan.emptyPrompt')}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] opacity-70">{t('notan.formatsHint')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Central Divider */}
        <div className="w-full h-px md:w-px md:h-full bg-[var(--color-outline-variant)] shrink-0" />

        {/* Right Panel: Notan */}
        <div className="flex-1 relative min-h-[300px] bg-[var(--color-surface-container)]">
          <div className="absolute top-[var(--spacing-grid-gutter)] left-[var(--spacing-grid-gutter)] z-10">
            <span className={`${panelLabel} text-[var(--color-primary)] flex items-center gap-2`}>
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] inline-block" aria-hidden />
              {t('notan.result')}
            </span>
          </div>
          <div className="absolute inset-0 p-[var(--spacing-grid-gutter)] pt-16 flex items-center justify-center">
            {pixels && (
              <canvas
                ref={canvasRef}
                role="img"
                aria-label={t('notan.resultAlt', { values: valuesLabel, threshold: umbral })}
                className="max-w-full max-h-full"
                style={CHECKER}
              />
            )}
          </div>
          {/* Estado (vacío / cargando / procesando), anunciado a lectores de pantalla */}
          <div aria-live="polite" className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {statusKey && (
              <span className="flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-outline-variant)] px-3 py-1.5 font-mono text-label-sm uppercase tracking-widest text-[var(--color-on-surface-variant)]">
                {(phase === 'loading' || phase === 'processing') && (
                  <Spinner className="size-4 text-[var(--color-primary)]" />
                )}
                {t(statusKey)}
              </span>
            )}
          </div>
          {pixels?.scaled && (
            <p className="absolute bottom-3 left-1/2 -translate-x-1/2 max-w-[calc(100%-2rem)] text-center bg-[var(--color-surface)] border border-[var(--color-outline-variant)] px-3 py-1 font-mono text-[10px] text-[var(--color-on-surface-variant)]">
              {t('notan.scaledNotice', { w: pixels.width, h: pixels.height, ow: pixels.originalWidth, oh: pixels.originalHeight })}
            </p>
          )}
        </div>
      </div>
    </>
  )
}
