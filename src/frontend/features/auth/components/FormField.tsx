'use client'

import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { fadeSlide, popIn } from '@frontend/shared/motion/tokens'

type NativeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'>

interface FormFieldProps extends NativeInputProps {
  label: string
  /** Mensaje de error ya traducido. Si existe, el campo se marca como inválido. */
  error?: string
  /** Marca el campo como válido (muestra confirmación visual). */
  valid?: boolean
  /** Texto de ayuda contextual; solo se muestra al enfocar y sin error. */
  help?: string
  /** Etiqueta accesible para el check de campo válido. */
  validLabel?: string
  /** Slot a la derecha del input (p. ej. botón mostrar/ocultar contraseña). */
  rightSlot?: ReactNode
}

const baseInput =
  'w-full bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] rounded-[var(--radius-sm)] p-3 transition-colors duration-200 font-sans text-sm focus:outline-none border'

/**
 * Campo de formulario controlado con label, validación por-campo, confirmación
 * visual de validez y ayuda contextual. Reenvía la ref al <input> para autofoco.
 */
const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
  { label, error, valid, help, validLabel, rightSlot, id, onFocus, onBlur, ...inputProps },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const msgId = `${inputId}-msg`
  const [focused, setFocused] = useState(false)

  const showError = Boolean(error)
  const showHelp = !showError && focused && Boolean(help)
  const showValidIcon = valid && !showError && !rightSlot

  const borderState = showError
    ? 'border-[var(--color-error)]'
    : valid
      ? 'border-[var(--color-primary)]'
      : 'border-[var(--color-outline-variant)] focus:border-[var(--color-primary)]'

  // Espacio para el slot/icono a la derecha sin solapar el texto.
  const rightPad = rightSlot || showValidIcon ? 'pr-11' : ''

  return (
    <div>
      <label
        className="block font-mono text-label-sm text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-2"
        htmlFor={inputId}
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={inputId}
          ref={ref}
          aria-invalid={showError}
          aria-describedby={showError || showHelp ? msgId : undefined}
          className={`${baseInput} ${borderState} ${rightPad}`}
          onFocus={(e) => {
            setFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            onBlur?.(e)
          }}
          {...inputProps}
        />

        {rightSlot && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-1">{rightSlot}</div>
        )}

        <AnimatePresence>
          {showValidIcon && (
            <motion.span
              variants={popIn}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-y-0 right-3 flex items-center text-[var(--color-primary)]"
              role="img"
              aria-label={validLabel}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Zona de mensaje con altura reservada para evitar saltos de layout. */}
      <div className="min-h-[1.25rem] mt-1.5">
        <AnimatePresence mode="wait" initial={false}>
          {showError ? (
            <motion.p
              key="error"
              id={msgId}
              role="alert"
              variants={fadeSlide}
              initial="initial"
              animate="animate"
              exit="exit"
              className="font-sans text-xs text-[var(--color-error)]"
            >
              {error}
            </motion.p>
          ) : showHelp ? (
            <motion.p
              key="help"
              id={msgId}
              variants={fadeSlide}
              initial="initial"
              animate="animate"
              exit="exit"
              className="font-sans text-xs text-[var(--color-on-surface-variant)]"
            >
              {help}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
})

export default FormField
