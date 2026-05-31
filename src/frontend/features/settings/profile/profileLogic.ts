export interface ProfileInitial {
  displayName: string
  username: string
  bio: string
  location: string
  website: string
  socials: {
    twitter?: string
    instagram?: string
    behance?: string
    artstation?: string
    tiktok?: string
  }
}

export const SOCIAL_KEYS = ['twitter', 'instagram', 'behance', 'artstation', 'tiktok'] as const
export const USERNAME_RE = /^[a-z0-9_]{3,30}$/
export const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i

export function clientValidate(state: ProfileInitial): Record<string, string> {
  const f: Record<string, string> = {}
  if (state.displayName.length > 60) f.displayName = 'Máximo 60 caracteres'
  if (state.username && !USERNAME_RE.test(state.username)) {
    f.username = '3-30: minúsculas, números, _'
  }
  if (state.bio.length > 300) f.bio = 'Máximo 300 caracteres'
  if (state.location.length > 80) f.location = 'Máximo 80 caracteres'
  if (state.website && !URL_RE.test(state.website)) f.website = 'URL inválida'
  for (const k of SOCIAL_KEYS) {
    const v = state.socials[k]
    if (v && !URL_RE.test(v)) f[`socials.${k}`] = 'URL inválida'
  }
  return f
}

export function diff(initial: ProfileInitial, current: ProfileInitial): Partial<ProfileInitial> {
  const out: Partial<ProfileInitial> = {}
  if (initial.displayName !== current.displayName) out.displayName = current.displayName
  if (initial.username !== current.username) out.username = current.username
  if (initial.bio !== current.bio) out.bio = current.bio
  if (initial.location !== current.location) out.location = current.location
  if (initial.website !== current.website) out.website = current.website
  const socialsChanged = SOCIAL_KEYS.some(
    (k) => (initial.socials[k] ?? '') !== (current.socials[k] ?? ''),
  )
  if (socialsChanged) out.socials = current.socials
  return out
}
