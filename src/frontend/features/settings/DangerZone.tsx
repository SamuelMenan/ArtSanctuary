'use client'

import { useState, useTransition } from 'react'
import { signOut } from 'next-auth/react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { useStatus } from './useStatus'
import { StatusBanner } from './StatusBanner'

type T = (key: string, vars?: Record<string, string | number>) => string

const CONFIRM_WORD = 'ELIMINAR'

const inputCls =
  'w-full bg-[var(--color-surface-container)] border border-[var(--color-surface-container-high)] rounded-sm px-4 py-3 text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors font-sans'
const inputErrCls = ' border-[var(--color-error)] focus:border-[var(--color-error)]'
const labelCls =
  'font-mono text-[var(--text-label-sm)] tracking-widest uppercase text-[var(--color-on-surface-variant)]'
const dangerBtn =
  'font-mono text-[var(--text-label-sm)] tracking-widest uppercase text-[var(--color-error)] border border-[var(--color-error-container)] px-6 py-3 rounded-sm hover:bg-[var(--color-error-container)]/20 transition-colors bg-transparent disabled:opacity-50 disabled:cursor-not-allowed'

export function DangerZone() {
  const { t } = usePreferences()
  // Desactivar
  const [deactPwd, setDeactPwd] = useState('')
  const [deactOpen, setDeactOpen] = useState(false)
  const [deactErrors, setDeactErrors] = useState<Record<string, string>>({})
  const deactStatus = useStatus()
  const [deactPending, startDeact] = useTransition()

  // Eliminar
  const [delPwd, setDelPwd] = useState('')
  const [delConfirm, setDelConfirm] = useState('')
  const [delOpen, setDelOpen] = useState(false)
  const [delErrors, setDelErrors] = useState<Record<string, string>>({})
  const delStatus = useStatus()
  const [delPending, startDel] = useTransition()

  function submitDeactivate(e: React.FormEvent) {
    e.preventDefault()
    setDeactErrors({})
    deactStatus.set({ kind: 'loading' })
    startDeact(async () => {
      try {
        const res = await fetch('/api/settings/account/deactivate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ currentPassword: deactPwd }),
        })
        const data = await res.json()
        if (!res.ok) {
          setDeactErrors(data?.error?.fields ?? {})
          deactStatus.set({
            kind: 'error',
            message: data?.error?.message ?? t('settings.saveError'),
          })
          return
        }
        deactStatus.set({ kind: 'success', message: t('settings.saved') })
        setTimeout(() => signOut({ callbackUrl: '/login' }), 800)
      } catch {
        deactStatus.set({ kind: 'error', message: t('settings.saveError') })
      }
    })
  }

  function submitDelete(e: React.FormEvent) {
    e.preventDefault()
    setDelErrors({})
    if (delConfirm !== CONFIRM_WORD) {
      setDelErrors({ confirm: t('settings.typeToConfirm', { word: CONFIRM_WORD }) })
      delStatus.set({ kind: 'error', message: t('settings.requiredFields') })
      return
    }
    delStatus.set({ kind: 'loading' })
    startDel(async () => {
      try {
        const res = await fetch('/api/settings/account', {
          method: 'DELETE',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ currentPassword: delPwd, confirm: delConfirm }),
        })
        const data = await res.json()
        if (!res.ok) {
          setDelErrors(data?.error?.fields ?? {})
          delStatus.set({
            kind: 'error',
            message: data?.error?.message ?? t('settings.saveError'),
          })
          return
        }
        delStatus.set({ kind: 'success', message: t('settings.saved') })
        setTimeout(() => signOut({ callbackUrl: '/' }), 800)
      } catch {
        delStatus.set({ kind: 'error', message: t('settings.saveError') })
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Deactivate */}
      <div className="border border-[var(--color-outline-variant)] rounded-sm p-6 md:p-8 bg-[var(--color-surface-container-low)]">
        <h4 className="font-sans font-semibold text-lg text-[var(--color-primary)] mb-2">
          {t('settings.deactivate')}
        </h4>
        <p className="text-[var(--color-on-surface-variant)] font-sans mb-6 text-sm">
          {t('settings.deactivateBody')}
        </p>

        {!deactOpen ? (
          <button
            type="button"
            onClick={() => setDeactOpen(true)}
            className="font-mono text-[var(--text-label-sm)] tracking-widest uppercase border border-[var(--color-outline-variant)] px-6 py-3 rounded-sm hover:border-[var(--color-primary)] transition-colors text-[var(--color-primary)] bg-transparent"
          >
            {t('settings.deactivate')}
          </button>
        ) : (
          <form onSubmit={submitDeactivate} className="space-y-4" noValidate>
            <div className="space-y-2">
              <label htmlFor="deact-pwd" className={labelCls}>
                {t('settings.currentPassword')}
              </label>
              <input
                id="deact-pwd"
                type="password"
                autoComplete="current-password"
                value={deactPwd}
                onChange={(e) => setDeactPwd(e.target.value)}
                required
                className={inputCls + (deactErrors.currentPassword ? inputErrCls : '')}
              />
              {deactErrors.currentPassword && (
                <p className="text-xs text-[var(--color-error)] font-mono">
                  {deactErrors.currentPassword}
                </p>
              )}
            </div>
            <StatusBanner status={deactStatus.status} />
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={deactPending || !deactPwd}
                className="bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] font-mono text-xs tracking-widest uppercase px-6 py-3 rounded-sm hover:bg-[var(--color-primary-container)] transition-colors disabled:opacity-50"
              >
                {deactPending ? t('settings.saving') : t('settings.deactivateConfirm')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeactOpen(false)
                  setDeactPwd('')
                  setDeactErrors({})
                  deactStatus.set({ kind: 'idle' })
                }}
                disabled={deactPending}
                className="font-mono text-[var(--text-label-sm)] tracking-widest uppercase text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors bg-transparent border border-transparent px-4 py-3"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Delete */}
      <div className="border border-[var(--color-error-container)] rounded-sm p-6 md:p-8 bg-[var(--color-surface-container-low)]">
        <div className="flex items-baseline gap-3 mb-2">
          <h4 className="font-sans font-semibold text-lg text-[var(--color-error)]">
            {t('settings.deleteAccount')}
          </h4>
          <span className="font-mono text-[10px] tracking-widest uppercase text-[var(--color-error)] opacity-80">
            · {t('settings.irreversible')}
          </span>
        </div>
        <p className="text-[var(--color-on-surface-variant)] font-sans mb-3 text-sm">
          {t('settings.deleteBody')}
        </p>
        <p className="text-[var(--color-on-surface-variant)] font-sans mb-6 text-sm">
          {t('settings.deleteImpact')}
        </p>

        {!delOpen ? (
          <button type="button" onClick={() => setDelOpen(true)} className={dangerBtn}>
            {t('settings.deleteAccount')}
          </button>
        ) : (
          <form onSubmit={submitDelete} className="space-y-4" noValidate>
            <div className="space-y-2">
              <label htmlFor="del-pwd" className={labelCls}>
                {t('settings.currentPassword')}
              </label>
              <input
                id="del-pwd"
                type="password"
                autoComplete="current-password"
                value={delPwd}
                onChange={(e) => setDelPwd(e.target.value)}
                required
                className={inputCls + (delErrors.currentPassword ? inputErrCls : '')}
              />
              {delErrors.currentPassword && (
                <p className="text-xs text-[var(--color-error)] font-mono">
                  {delErrors.currentPassword}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="del-confirm" className={labelCls}>
                {t('settings.typeToConfirm', { word: CONFIRM_WORD })}
              </label>
              <input
                id="del-confirm"
                type="text"
                autoComplete="off"
                value={delConfirm}
                onChange={(e) => setDelConfirm(e.target.value)}
                required
                className={inputCls + (delErrors.confirm ? inputErrCls : '')}
              />
              {delErrors.confirm && (
                <p className="text-xs text-[var(--color-error)] font-mono">{delErrors.confirm}</p>
              )}
            </div>
            <StatusBanner status={delStatus.status} />
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={delPending || !delPwd || delConfirm !== CONFIRM_WORD}
                className={dangerBtn}
              >
                {delPending ? t('settings.saving') : t('settings.deleteAccount')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDelOpen(false)
                  setDelPwd('')
                  setDelConfirm('')
                  setDelErrors({})
                  delStatus.set({ kind: 'idle' })
                }}
                disabled={delPending}
                className="font-mono text-[var(--text-label-sm)] tracking-widest uppercase text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors bg-transparent border border-transparent px-4 py-3"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
