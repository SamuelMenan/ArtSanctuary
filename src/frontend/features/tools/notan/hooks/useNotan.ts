'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { loadImage } from '@shared/lib/image/canvas'
import { NOTAN_MAX_DIM, applyNotan, computeLuminance, fitWithin, type NotanMode, type NotanOptions } from '@shared/lib/image/notan'
import {
  NotanError,
  validateImageDimensions,
  validateImageFile,
  type NotanErrorCode,
  type NotanPhase,
} from '../lib/notanState'

/** Copia de trabajo de la imagen: píxeles + luminancia precalculada. */
export interface NotanPixels {
  width: number
  height: number
  originalWidth: number
  originalHeight: number
  /** La imagen se redujo a {@link NOTAN_MAX_DIM} px de lado largo. */
  scaled: boolean
  rgba: Uint8ClampedArray
  lum: Float32Array
}

/** Dibuja la imagen (reducida si hace falta) y lee sus píxeles. No toca `img`. */
function readPixels(img: HTMLImageElement): NotanPixels {
  const check = validateImageDimensions(img.naturalWidth, img.naturalHeight)
  if (!check.ok) throw new NotanError(check.error)

  const { width, height, scaled } = fitWithin(img.naturalWidth, img.naturalHeight, NOTAN_MAX_DIM)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new NotanError('canvas', 'No 2D context')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, width, height)
  const { data } = ctx.getImageData(0, 0, width, height)

  return {
    width,
    height,
    originalWidth: img.naturalWidth,
    originalHeight: img.naturalHeight,
    scaled,
    rgba: data,
    lum: computeLuminance(data),
  }
}

/**
 * Estado completo de Notan: selección y carga del archivo (URL local, la imagen
 * nunca sale del navegador), lectura de píxeles y render del resultado en
 * `canvasRef` cada vez que cambian la imagen, el umbral o el modo.
 */
export function useNotan({
  threshold,
  mode,
  canvasRef,
}: {
  threshold: number
  mode: NotanMode
  canvasRef: RefObject<HTMLCanvasElement | null>
}) {
  const [phase, setPhase] = useState<NotanPhase>('empty')
  const [errorCode, setErrorCode] = useState<NotanErrorCode | null>(null)
  /** Archivo rechazado antes de leerlo: no descarta la imagen actual. */
  const [fileError, setFileError] = useState<NotanErrorCode | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [pixels, setPixels] = useState<NotanPixels | null>(null)

  /** Parámetros con los que se pintó el canvas por última vez (para la descarga). */
  const rendered = useRef<NotanOptions | null>(null)
  const outRef = useRef<ImageData | null>(null)
  const urlRef = useRef<string | null>(null)
  // Descarta resultados de cargas viejas si el usuario elige otra imagen antes.
  const loadToken = useRef(0)

  // Libera la URL local al salir de la pantalla.
  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
  }, [])

  const replaceUrl = useCallback((next: string | null) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = next
    setImageUrl(next)
  }, [])

  const fail = useCallback((code: NotanErrorCode) => {
    replaceUrl(null)
    setPixels(null)
    rendered.current = null
    setErrorCode(code)
    setPhase('error')
  }, [replaceUrl])

  const selectFile = useCallback(async (file: File | null) => {
    const check = validateImageFile(file)
    if (!check.ok) {
      setFileError(check.error)
      return
    }
    setFileError(null)
    setErrorCode(null)
    setPhase('loading')
    const token = ++loadToken.current
    const url = URL.createObjectURL(file as File)

    let img: HTMLImageElement
    try {
      img = await loadImage(url)
    } catch (err) {
      URL.revokeObjectURL(url)
      if (token !== loadToken.current) return
      // Archivo del usuario ilegible: caso esperado, ya se muestra en pantalla.
      console.warn('[notan] decode failed', err)
      fail('decode')
      return
    }
    if (token !== loadToken.current) {
      URL.revokeObjectURL(url)
      return
    }

    let next: NotanPixels
    try {
      next = readPixels(img)
    } catch (err) {
      URL.revokeObjectURL(url)
      console.error('[notan] reading pixels failed', err)
      fail(err instanceof NotanError ? err.code : 'process')
      return
    }

    replaceUrl(url)
    rendered.current = null
    setPixels(next)
    setPhase('processing')
  }, [fail, replaceUrl])

  // Render del Notan: en el siguiente frame (al mover el slider deprisa solo se
  // procesa el último valor). El canvas existe siempre que haya `pixels`.
  useEffect(() => {
    if (!pixels) return
    const frame = requestAnimationFrame(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      try {
        if (canvas.width !== pixels.width || canvas.height !== pixels.height) {
          canvas.width = pixels.width
          canvas.height = pixels.height
        }
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new NotanError('canvas', 'No 2D context')
        const out = outRef.current
        const buffer = out && out.width === pixels.width && out.height === pixels.height
          ? out
          : ctx.createImageData(pixels.width, pixels.height)
        outRef.current = buffer
        applyNotan(pixels.lum, pixels.rgba, buffer.data, { threshold, mode })
        ctx.putImageData(buffer, 0, 0)
        rendered.current = { threshold, mode }
        setErrorCode(null)
        setPhase('ready')
      } catch (err) {
        console.error('[notan] processing failed', err)
        rendered.current = null
        setErrorCode(err instanceof NotanError ? err.code : 'process')
        setPhase('error')
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [pixels, threshold, mode, canvasRef])

  return { phase, errorCode, fileError, imageUrl, pixels, rendered, selectFile }
}
