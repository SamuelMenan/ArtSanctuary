'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export type FollowKind = 'followers' | 'following'

interface UserItem {
  _id: string
  username: string
  displayName: string
  avatarUrl: string
}

type T = (key: string, vars?: Record<string, string | number>) => string

interface Props {
  open: boolean
  userId: string
  kind: FollowKind
  title: string
  emptyMessage: string
  t: T
  onClose: () => void
}

export function FollowListModal({ open, userId, kind, title, emptyMessage, t, onClose }: Props) {
  const [result, setResult] = useState<{ key: string; users: UserItem[] | null; error: string | null }>({
    key: '',
    users: null,
    error: null,
  })
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Carga datos al abrir. El resultado se etiqueta con la petición que lo produjo
  // para que `users`/`error` se deriven y se vacíen solos al cambiar userId/kind.
  useEffect(() => {
    if (!open) return
    const key = `${userId}:${kind}`
    let cancelled = false
    window.fetch(`/api/users/${userId}/${kind}`)
      .then(async (res) => {
        const data = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setResult({ key, users: null, error: res.status === 403 ? t('profile.privateList') : data?.error?.message ?? 'Error' })
          return
        }
        setResult({ key, users: data.users ?? [], error: null })
      })
      .catch(() => {
        if (!cancelled) setResult({ key, users: null, error: t('settings.saveError') })
      })
    return () => {
      cancelled = true
    }
  }, [open, userId, kind, t])

  // Escape + focus inicial + bloqueo de scroll.
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  // Solo se muestra el resultado si corresponde a la petición actual; al cambiar
  // userId/kind queda "obsoleto" y users/error vuelven a null sin ningún setter.
  const matches = result.key === `${userId}:${kind}`
  const users = matches ? result.users : null
  const error = matches ? result.error : null

  if (!open) return null

  return (
    <dialog
      open
      aria-modal="true"
      aria-labelledby="follow-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 m-0 w-full max-w-none h-full max-h-none border-0"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target === e.currentTarget) onClose()
        }
      }}
    >
      <div
        ref={dialogRef}
        className="w-full sm:max-w-md bg-[var(--color-surface)] border border-[var(--color-outline-variant)] rounded-t-md sm:rounded-md shadow-xl max-h-[80vh] flex flex-col"
      >
        <header className="flex items-center justify-between border-b border-[var(--color-outline-variant)] px-5 py-4">
          <h2
            id="follow-modal-title"
            className="font-sans font-semibold text-[var(--color-primary)] uppercase tracking-widest text-sm"
          >
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t('profile.close')}
            className="font-mono text-xs uppercase tracking-widest text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] border border-transparent hover:border-[var(--color-outline-variant)] px-3 py-1.5 rounded-sm transition-colors"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {error ? (
            <div className="text-center py-10 font-mono text-xs uppercase tracking-widest text-[var(--color-error)]">
              {error}
            </div>
          ) : users === null ? (
            <ul className="space-y-2 px-3 py-3" aria-live="polite">
              {[0, 1, 2, 3].map((i) => (
                <li
                  key={i}
                  className="h-12 rounded-sm bg-[var(--color-surface-container-low)] animate-pulse"
                />
              ))}
            </ul>
          ) : users.length === 0 ? (
            <div className="text-center py-10 font-sans text-sm text-[var(--color-on-surface-variant)]">
              {emptyMessage}
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-outline-variant)]">
              {users.map((u) => (
                <li key={u._id}>
                  <Link
                    href={`/profile/${u._id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-3 hover:bg-[var(--color-surface-container-low)] transition-colors"
                  >
                    {u.avatarUrl ? (
                      <Image
                        src={u.avatarUrl}
                        alt=""
                        width={40}
                        height={40}
                        className="size-10 rounded-full object-cover border border-[var(--color-outline-variant)] flex-shrink-0"
                      />
                    ) : (
                      <div className="size-10 rounded-full bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] flex items-center justify-center flex-shrink-0">
                        <span className="font-sans text-base font-semibold text-[var(--color-primary)]">
                          {(u.displayName || u.username || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="font-sans text-[var(--color-primary)] truncate">
                        {u.displayName || u.username}
                      </span>
                      <span className="font-mono text-xs text-[var(--color-on-surface-variant)] uppercase tracking-widest truncate">
                        @{u.username}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </dialog>
  )
}
