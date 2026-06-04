'use client'

import { AnimatePresence, motion } from 'motion/react'
import { fadeSlide, transition } from '@frontend/shared/motion/tokens'
import { evaluatePassword, passwordStrength } from './validation'

interface PasswordStrengthProps {
  value: string
  t: (key: string) => string
}

const STRENGTH_META = {
  weak: { labelKey: 'auth.strengthWeak', width: '33%', color: 'bg-[var(--color-error)]' },
  medium: { labelKey: 'auth.strengthMedium', width: '66%', color: 'bg-[var(--color-outline)]' },
  strong: { labelKey: 'auth.strengthStrong', width: '100%', color: 'bg-[var(--color-primary)]' },
} as const

function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 transition-colors">
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
          met
            ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
            : 'border-[var(--color-outline-variant)] text-[var(--color-outline-variant)]'
        }`}
        aria-hidden="true"
      >
        {met ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <span className="h-1 w-1 rounded-full bg-current" />
        )}
      </span>
      <span
        className={`font-sans text-xs transition-colors ${
          met ? 'text-[var(--color-on-surface)]' : 'text-[var(--color-on-surface-variant)]'
        }`}
      >
        {label}
      </span>
    </li>
  )
}

/** Medidor de fortaleza + checklist de requisitos, reactivo al valor. */
export default function PasswordStrength({ value, t }: PasswordStrengthProps) {
  const checks = evaluatePassword(value)
  const strength = passwordStrength(checks)
  const meta = STRENGTH_META[strength]

  return (
    <AnimatePresence initial={false}>
      {value ? (
        <motion.div
          variants={fadeSlide}
          initial="initial"
          animate="animate"
          exit="exit"
          className="mt-2 overflow-hidden"
        >
          <div className="flex items-center gap-3">
            <div
              className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-container-high)]"
              role="progressbar"
              aria-label={t('auth.passwordStrength')}
            >
              <motion.div
                className={`h-full rounded-full ${meta.color}`}
                animate={{ width: meta.width }}
                transition={transition.base}
              />
            </div>
            <span className="font-mono text-label-sm uppercase tracking-widest text-[var(--color-on-surface-variant)]">
              {t(meta.labelKey)}
            </span>
          </div>

          <ul className="mt-3 space-y-1.5" aria-label={t('auth.passwordRequirements')}>
            <Requirement met={checks.length} label={t('auth.passwordMinLength')} />
            <Requirement met={checks.upper} label={t('auth.passwordNeedsUpper')} />
            <Requirement met={checks.number} label={t('auth.passwordNeedsNumber')} />
          </ul>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
