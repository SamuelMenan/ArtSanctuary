import { describe, expect, it } from 'vitest'
import {
  NOTAN_MAX_FILE_BYTES,
  NOTAN_MAX_PIXELS,
  NotanError,
  canDownload,
  errorMessageKey,
  phaseMessageKey,
  validateImageDimensions,
  validateImageFile,
  type NotanPhase,
} from './notanState'

describe('validateImageFile', () => {
  it('reports a missing or empty file', () => {
    expect(validateImageFile(null)).toEqual({ ok: false, error: 'missing' })
    expect(validateImageFile(undefined)).toEqual({ ok: false, error: 'missing' })
    expect(validateImageFile({ type: 'image/png', size: 0 })).toEqual({ ok: false, error: 'missing' })
  })

  it('rejects files that are not PNG, JPEG or WebP', () => {
    for (const type of ['application/pdf', 'text/plain', 'image/gif', 'image/svg+xml', '']) {
      expect(validateImageFile({ type, size: 1000 })).toEqual({ ok: false, error: 'type' })
    }
  })

  it('accepts PNG, JPEG and WebP', () => {
    for (const type of ['image/png', 'image/jpeg', 'image/webp']) {
      expect(validateImageFile({ type, size: 1000 })).toEqual({ ok: true })
    }
  })

  it('rejects files over the size limit', () => {
    expect(validateImageFile({ type: 'image/png', size: NOTAN_MAX_FILE_BYTES })).toEqual({ ok: true })
    expect(validateImageFile({ type: 'image/png', size: NOTAN_MAX_FILE_BYTES + 1 })).toEqual({ ok: false, error: 'size' })
  })
})

describe('validateImageDimensions', () => {
  it('treats a zero size as unreadable', () => {
    expect(validateImageDimensions(0, 100)).toEqual({ ok: false, error: 'decode' })
  })

  it('rejects images over the megapixel limit', () => {
    expect(validateImageDimensions(4000, 3000)).toEqual({ ok: true })
    expect(validateImageDimensions(NOTAN_MAX_PIXELS + 1, 1)).toEqual({ ok: false, error: 'dimensions' })
  })
})

describe('view state', () => {
  const phases: NotanPhase[] = ['empty', 'loading', 'processing', 'ready', 'error']

  it('enables download only with a valid result', () => {
    expect(phases.filter(canDownload)).toEqual(['ready'])
  })

  it('shows the empty message when there is no image', () => {
    expect(phaseMessageKey('empty')).toBe('notan.resultEmpty')
  })

  it('shows loading and processing messages, and none once ready or on error', () => {
    expect(phaseMessageKey('loading')).toBe('notan.loading')
    expect(phaseMessageKey('processing')).toBe('notan.processing')
    expect(phaseMessageKey('ready')).toBeNull()
    expect(phaseMessageKey('error')).toBeNull()
  })

  it('maps error codes to translation keys', () => {
    expect(errorMessageKey('type')).toBe('notan.errors.type')
    expect(errorMessageKey('process')).toBe('notan.errors.process')
  })

  it('NotanError carries its code', () => {
    const err = new NotanError('canvas')
    expect(err).toBeInstanceOf(Error)
    expect(err.code).toBe('canvas')
  })
})
