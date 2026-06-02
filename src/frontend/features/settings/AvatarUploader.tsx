'use client'

import Image from 'next/image'
import { useRef, useState, useTransition } from 'react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { useStatus } from './useStatus'
import { StatusBanner } from './StatusBanner'

const MAX_BYTES = 3 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

type T = (key: string, vars?: Record<string, string | number>) => string

interface Props {
  initialAvatarUrl: string
  displayName: string
}

export function AvatarUploader({ initialAvatarUrl, displayName }: Props) {
  const { t } = usePreferences()
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [preview, setPreview] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const { status, set } = useStatus()

  const initial = (displayName || 'U').charAt(0).toUpperCase()
  const visibleSrc = preview || avatarUrl

  function pick() {
    inputRef.current?.click()
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!ALLOWED.includes(file.type)) {
      set({ kind: 'error', message: t('settings.avatarInvalidType') })
      return
    }
    if (file.size > MAX_BYTES) {
      set({ kind: 'error', message: t('settings.avatarTooLarge') })
      return
    }

    const localPreview = URL.createObjectURL(file)
    setPreview(localPreview)
    set({ kind: 'loading' })

    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/settings/avatar', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) {
          set({
            kind: 'error',
            message: data?.error?.message ?? t('settings.saveError'),
          })
          setPreview(null)
          URL.revokeObjectURL(localPreview)
          return
        }
        setAvatarUrl(data.avatarUrl)
        setPreview(null)
        URL.revokeObjectURL(localPreview)
        set({ kind: 'success', message: t('settings.avatarUpdated') })
      } catch {
        set({ kind: 'error', message: t('settings.saveError') })
        setPreview(null)
        URL.revokeObjectURL(localPreview)
      }
    })
  }

  function remove() {
    if (!avatarUrl) return
    set({ kind: 'loading' })
    startTransition(async () => {
      try {
        const res = await fetch('/api/settings/avatar', { method: 'DELETE' })
        if (!res.ok) {
          set({ kind: 'error', message: t('settings.saveError') })
          return
        }
        setAvatarUrl('')
        set({ kind: 'success', message: t('settings.avatarRemoved') })
      } catch {
        set({ kind: 'error', message: t('settings.saveError') })
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="size-20 rounded-full overflow-hidden border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] flex items-center justify-center flex-shrink-0 relative">
          {visibleSrc ? (
            <Image
              src={visibleSrc}
              alt={`Avatar de ${displayName}`}
              width={80}
              height={80}
              className="w-full h-full object-cover"
              unoptimized={visibleSrc.startsWith('blob:')}
            />
          ) : (
            <span className="font-sans text-3xl font-semibold text-[var(--color-primary)]">
              {initial}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <button
            type="button"
            onClick={pick}
            disabled={pending}
            className="font-mono text-label-sm tracking-widest uppercase border border-[var(--color-outline-variant)] px-4 py-2 rounded-sm hover:border-[var(--color-primary)] transition-colors text-[var(--color-primary)] bg-transparent disabled:opacity-50"
          >
            {pending ? t('settings.uploading') : t('settings.uploadNewPhoto')}
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={pending || !avatarUrl}
            className="font-mono text-label-sm tracking-widest uppercase text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)] transition-colors bg-transparent border border-transparent px-4 py-2 rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('settings.removePhoto')}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED.join(',')}
            className="sr-only"
            onChange={onFile}
            aria-label={t('settings.uploadNewPhoto')}
          />
        </div>
      </div>
      <p className="font-mono text-xs text-[var(--color-on-surface-variant)]">
        {t('settings.avatarHint')}
      </p>
      <StatusBanner status={status} />
    </div>
  )
}
