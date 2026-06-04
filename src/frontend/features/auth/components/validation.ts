/**
 * Reglas de validación compartidas entre Login y Registro.
 * Cada validador devuelve una clave i18n (para pasar a `t`) o `null` si es válido.
 * Mantener sincronizado con la validación del backend en
 * `src/app/api/auth/register/route.ts`.
 */

// Coincide con la política reforzada: min 8 + mayúscula + número.
export const PASSWORD_MIN_LENGTH = 8
export const USERNAME_MIN_LENGTH = 3

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface PasswordChecks {
  length: boolean
  upper: boolean
  number: boolean
}

/** Evalúa cada requisito de la contraseña por separado (para checklist + medidor). */
export function evaluatePassword(value: string): PasswordChecks {
  return {
    length: value.length >= PASSWORD_MIN_LENGTH,
    upper: /[A-Z]/.test(value),
    number: /[0-9]/.test(value),
  }
}

export type PasswordStrength = 'weak' | 'medium' | 'strong'

export function passwordStrength(checks: PasswordChecks): PasswordStrength {
  const passed = Number(checks.length) + Number(checks.upper) + Number(checks.number)
  if (passed <= 1) return 'weak'
  if (passed === 2) return 'medium'
  return 'strong'
}

export function isPasswordValid(checks: PasswordChecks): boolean {
  return checks.length && checks.upper && checks.number
}

export function validateEmail(value: string): string | null {
  if (!value.trim()) return 'auth.emailRequired'
  if (!EMAIL_RE.test(value.trim())) return 'auth.emailInvalid'
  return null
}

export function validateUsername(value: string): string | null {
  if (!value.trim()) return 'auth.usernameRequired'
  if (value.trim().length < USERNAME_MIN_LENGTH) return 'auth.usernameTooShort'
  return null
}

/** Para registro: exige la política completa. Devuelve la primera regla incumplida. */
export function validatePassword(value: string): string | null {
  if (!value) return 'auth.passwordRequired'
  const checks = evaluatePassword(value)
  if (!checks.length) return 'auth.passwordMinLength'
  if (!checks.upper) return 'auth.passwordNeedsUpper'
  if (!checks.number) return 'auth.passwordNeedsNumber'
  return null
}

/** Para login: solo exige que haya algo escrito (no validamos política de cuentas viejas). */
export function validateLoginPassword(value: string): string | null {
  if (!value) return 'auth.passwordRequired'
  return null
}

export function validateConfirm(password: string, confirm: string): string | null {
  if (!confirm) return 'auth.confirmRequired'
  if (password !== confirm) return 'auth.passwordsMismatch'
  return null
}
