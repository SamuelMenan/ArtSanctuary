'use client'

import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import FormField from './FormField'
import { transition } from '@frontend/shared/motion/tokens'

interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type'> {
  label: string
  error?: string
  valid?: boolean
  help?: string
  validLabel?: string
  /** aria-label del botón cuando la contraseña está oculta (mostrar). */
  showLabel: string
  /** aria-label del botón cuando la contraseña está visible (ocultar). */
  hideLabel: string
}

const EyeOpen = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOff = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
)

/** Campo de contraseña con botón mostrar/ocultar accesible. */
const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(
  { showLabel, hideLabel, ...fieldProps },
  ref,
) {
  const [visible, setVisible] = useState(false)

  return (
    <FormField
      ref={ref}
      type={visible ? 'text' : 'password'}
      rightSlot={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          tabIndex={0}
          className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-on-surface-variant)] transition-colors hover:text-[var(--color-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-outline)]"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={visible ? 'off' : 'on'}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={transition.fast}
              className="flex items-center justify-center"
            >
              {visible ? EyeOff : EyeOpen}
            </motion.span>
          </AnimatePresence>
        </button>
      }
      {...fieldProps}
    />
  )
})

export default PasswordField
