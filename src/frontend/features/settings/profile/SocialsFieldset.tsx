'use client'

import { inputCls, inputErrCls, labelCls } from '../formStyles'
import { SOCIAL_KEYS, type ProfileInitial } from './profileLogic'

interface SocialsFieldsetProps {
  legend: string
  socials: ProfileInitial['socials']
  fieldErrors: Record<string, string>
  updateSocial: (k: (typeof SOCIAL_KEYS)[number], value: string) => void
}

export function SocialsFieldset({ legend, socials, fieldErrors, updateSocial }: SocialsFieldsetProps) {
  return (
    <fieldset className="space-y-3">
      <legend className={labelCls + ' mb-2'}>{legend}</legend>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SOCIAL_KEYS.map((k) => {
          const errKey = `socials.${k}`
          return (
            <div key={k} className="space-y-1">
              <label htmlFor={`s-${k}`} className="sr-only">
                {k}
              </label>
              <input
                id={`s-${k}`}
                type="url"
                aria-label={k}
                inputMode="url"
                placeholder={`https://${k}.com/...`}
                value={socials[k] ?? ''}
                onChange={(e) => updateSocial(k, e.target.value)}
                className={inputCls + (fieldErrors[errKey] ? inputErrCls : '')}
              />
              {fieldErrors[errKey] && (
                <p className="text-xs text-[var(--color-error)] font-mono">
                  {fieldErrors[errKey]}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}
