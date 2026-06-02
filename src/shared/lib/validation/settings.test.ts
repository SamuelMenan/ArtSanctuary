import { describe, it, expect } from 'vitest'
import {
  validateProfile, validateEmail, validatePassword,
  validatePreferences, validateNotifications, validatePrivacy,
} from './settings'

describe('validateEmail', () => {
  it('normaliza y acepta email válido', () => {
    const r = validateEmail('  John@Example.COM ')
    expect(r).toEqual({ ok: true, value: 'john@example.com' })
  })
  it('rechaza formato inválido y tipo no string', () => {
    expect(validateEmail('no-arroba').ok).toBe(false)
    expect(validateEmail(123).ok).toBe(false)
  })
})

describe('validatePassword', () => {
  it('acepta ≥8 con letra y número', () => {
    expect(validatePassword('abcd1234')).toEqual({ ok: true, value: 'abcd1234' })
  })
  it('rechaza corta y sin complejidad', () => {
    expect(validatePassword('ab1').ok).toBe(false)        // < 8
    expect(validatePassword('abcdefgh').ok).toBe(false)   // sin número
    expect(validatePassword('12345678').ok).toBe(false)   // sin letra
  })
})

describe('validateProfile', () => {
  it('rechaza body no-objeto', () => {
    expect(validateProfile(null).ok).toBe(false)
    expect(validateProfile('x').ok).toBe(false)
  })
  it('acepta perfil válido y normaliza username', () => {
    const r = validateProfile({ username: 'John_Doe', displayName: ' Juan ', website: 'https://x.com' })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.username).toBe('john_doe')
      expect(r.value.displayName).toBe('Juan')
    }
  })
  it('marca username con formato inválido', () => {
    const r = validateProfile({ username: 'ab' }) // < 3
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.fields.username).toBeDefined()
  })
  it('marca website y social con URL inválida', () => {
    const r = validateProfile({ website: 'ftp://nope', socials: { twitter: 'no-url' } })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.fields.website).toBeDefined()
      expect(r.fields['socials.twitter']).toBeDefined()
    }
  })
})

describe('validatePreferences', () => {
  it('acepta valores del enum', () => {
    expect(validatePreferences({ theme: 'dark', locale: 'es' }).ok).toBe(true)
  })
  it('rechaza valor fuera de enum', () => {
    expect(validatePreferences({ theme: 'blue' }).ok).toBe(false)
  })
})

describe('validateNotifications / validatePrivacy', () => {
  it('aceptan booleanos, rechazan otros tipos', () => {
    expect(validateNotifications({ likes: true, comments: false }).ok).toBe(true)
    expect(validateNotifications({ likes: 'yes' }).ok).toBe(false)
    expect(validatePrivacy({ showEmail: false }).ok).toBe(true)
    expect(validatePrivacy({ showEmail: 1 }).ok).toBe(false)
  })
})
