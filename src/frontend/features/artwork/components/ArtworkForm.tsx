'use client';

import { type ArtworkCategory } from '@shared/lib/useArtworkAutoFill';
import Spinner from '@frontend/shared/ui/Spinner';
import type { useUploadArtwork, DateType } from '../hooks/useUploadArtwork';

type UploadArtwork = ReturnType<typeof useUploadArtwork>;

interface ArtworkFormProps {
  t: UploadArtwork['t'];
  loading: boolean;
  formData: UploadArtwork['formData'];
  setFormData: UploadArtwork['setFormData'];
  presets: UploadArtwork['presets'];
  showDepth: boolean;
  dimensionUnitOptions: string[];
  applyPreset: UploadArtwork['applyPreset'];
}

const inputClass = 'w-full bg-[var(--color-surface-container)] border border-[var(--color-surface-container-high)] rounded-sm px-4 py-3 text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors font-sans';
const labelClass = 'font-mono text-label-sm uppercase tracking-widest text-[var(--color-on-surface-variant)]';

export default function ArtworkForm({
  t,
  loading,
  formData,
  setFormData,
  presets,
  showDepth,
  dimensionUnitOptions,
  applyPreset,
}: ArtworkFormProps) {
  return (
    <div className="w-full lg:w-3/5 flex flex-col gap-8">
      {/* IDENTIFICATION */}
      <section className="space-y-6 border border-[var(--color-surface-container-high)] p-6 rounded-sm bg-[var(--color-surface-container-lowest)]">
        <h2 className="font-sans font-semibold text-lg text-[var(--color-primary)] flex items-center gap-2 border-b border-[var(--color-surface-container-high)] pb-2">
          <span className="material-symbols-outlined">label</span> {t('upload.identification')}
        </h2>

        <div className="space-y-2">
          <label className={labelClass}>{t('upload.title')}</label>
          <input type="text" aria-label={t('upload.title')} required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className={inputClass} placeholder={t('upload.placeholderTitle')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={labelClass}>{t('upload.category')}</label>
            <select aria-label={t('upload.category')} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as ArtworkCategory })} className={`${inputClass} appearance-none cursor-pointer`}>
              <option value="pintura">{t('upload.catPainting')}</option>
              <option value="escultura">{t('upload.catSculpture')}</option>
              <option value="ilustracion">{t('upload.catIllustration')}</option>
              <option value="fotografia">{t('upload.catPhotography')}</option>
              <option value="otro">{t('upload.catOther')}</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className={labelClass}>{t('upload.visibility')}</label>
            <select aria-label={t('upload.visibility')} value={formData.visibility} onChange={e => setFormData({ ...formData, visibility: e.target.value })} className={`${inputClass} appearance-none cursor-pointer`}>
              <option value="public">{t('upload.public')}</option>
              <option value="unlisted">{t('upload.unlisted')}</option>
              <option value="private">{t('upload.private')}</option>
            </select>
          </div>
        </div>
      </section>

      {/* CREATION DATE */}
      <section className="space-y-6 border border-[var(--color-surface-container-high)] p-6 rounded-sm bg-[var(--color-surface-container-lowest)]">
        <h2 className="font-sans font-semibold text-lg text-[var(--color-primary)] flex items-center gap-2 border-b border-[var(--color-surface-container-high)] pb-2">
          <span className="material-symbols-outlined">calendar_month</span> {t('upload.createDate')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className={labelClass}>{t('upload.format')}</label>
            <select aria-label={t('upload.format')} value={formData.dateType} onChange={e => setFormData({ ...formData, dateType: e.target.value as DateType })} className={`${inputClass} appearance-none cursor-pointer`}>
              <option value="year">{t('upload.year')}</option>
              <option value="exact">{t('upload.exact')}</option>
              <option value="monthyear">{t('upload.monthyear')}</option>
              <option value="range">{t('upload.range')}</option>
              <option value="approx">{t('upload.approx')}</option>
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>{t('upload.value')}</label>
            <input
              type={formData.dateType === 'exact' ? 'date' : 'text'}
              aria-label={t('upload.value')}
              value={formData.dateValue}
              onChange={e => setFormData({ ...formData, dateValue: e.target.value })}
              className={inputClass}
              placeholder={formData.dateType === 'range' ? t('upload.placeholderDateRange') : formData.dateType === 'approx' ? t('upload.placeholderDateApprox') : t('upload.placeholderDateExact')}
            />
          </div>
        </div>
      </section>

      {/* PHYSICAL SPECS */}
      <section className="space-y-6 border border-[var(--color-surface-container-high)] p-6 rounded-sm bg-[var(--color-surface-container-lowest)]">
        <h2 className="font-sans font-semibold text-lg text-[var(--color-primary)] flex items-center gap-2 border-b border-[var(--color-surface-container-high)] pb-2">
          <span className="material-symbols-outlined">architecture</span> {t('upload.physicalSpecs')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={labelClass}>{t('upload.medium')}</label>
            <input type="text" aria-label={t('upload.medium')} value={formData.medium} onChange={e => setFormData({ ...formData, medium: e.target.value })} className={inputClass} placeholder={presets.mediums[0] ? t(presets.mediums[0]) :  t('upload.placeholderMedium')} />
            {presets.mediums.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {presets.mediums.map(m => (
                  <button key={m} type="button" onClick={() => applyPreset('medium', t(m))} className="font-mono text-[10px] border border-[var(--color-outline-variant)] px-2 py-1 rounded-sm hover:bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] transition-colors">{t(m)}</button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className={labelClass}>{t('upload.technique')}</label>
            <input type="text" aria-label={t('upload.technique')} value={formData.technique} onChange={e => setFormData({ ...formData, technique: e.target.value })} className={inputClass} placeholder={presets.techniques[0] ? t(presets.techniques[0]) :  t('upload.placeholderTechnique')} />
            {presets.techniques.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {presets.techniques.map(tk => (
                  <button key={tk} type="button" onClick={() => applyPreset('technique', t(tk))} className="font-mono text-[10px] border border-[var(--color-outline-variant)] px-2 py-1 rounded-sm hover:bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] transition-colors">{t(tk)}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClass}>{t('upload.dimensions')}</label>
          <div className="flex gap-2">
            <input type="number" aria-label={t('upload.width')} placeholder={t('upload.width')} value={formData.dimWidth} onChange={e => setFormData({ ...formData, dimWidth: e.target.value })} className={`${inputClass} text-center`} />
            <span className="text-[var(--color-on-surface-variant)] flex items-center">x</span>
            <input type="number" aria-label={t('upload.height')} placeholder={t('upload.height')} value={formData.dimHeight} onChange={e => setFormData({ ...formData, dimHeight: e.target.value })} className={`${inputClass} text-center`} />
            {showDepth && (
              <>
                <span className="text-[var(--color-on-surface-variant)] flex items-center">x</span>
                <input type="number" aria-label={t('upload.depth')} placeholder={t('upload.depth')} value={formData.dimDepth} onChange={e => setFormData({ ...formData, dimDepth: e.target.value })} className={`${inputClass} text-center`} />
              </>
            )}
            <select aria-label={t('upload.dimUnit')} value={formData.dimUnit} onChange={e => setFormData({ ...formData, dimUnit: e.target.value })} className={`${inputClass} text-center cursor-pointer w-32`}>
              {dimensionUnitOptions.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* CONTEXT & RIGHTS */}
      <section className="space-y-6 border border-[var(--color-surface-container-high)] p-6 rounded-sm bg-[var(--color-surface-container-lowest)]">
        <h2 className="font-sans font-semibold text-lg text-[var(--color-primary)] flex items-center gap-2 border-b border-[var(--color-surface-container-high)] pb-2">
          <span className="material-symbols-outlined">gavel</span> {t('upload.contextRights')}
        </h2>

        <div className="space-y-2">
          <label className={labelClass}>{t('upload.curatorialDescription')}</label>
          <textarea aria-label={t('upload.curatorialDescription')} rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className={`${inputClass} resize-none`} placeholder={t('upload.placeholderContext')} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={labelClass}>{t('upload.copyrightHolder')}</label>
            <input type="text" aria-label={t('upload.copyrightHolder')} value={formData.copyrightHolder} onChange={e => setFormData({ ...formData, copyrightHolder: e.target.value })} className={inputClass} placeholder={t('upload.placeholderAuthor')} />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>{t('upload.license')}</label>
            <select aria-label={t('upload.license')} value={formData.licenseType} onChange={e => setFormData({ ...formData, licenseType: e.target.value })} className={`${inputClass} appearance-none cursor-pointer`}>
              <option value="all-rights-reserved">{t('upload.licenseAllRights')}</option>
              <option value="cc-by">{t('upload.licenseCcBy')}</option>
              <option value="cc-by-nc">{t('upload.licenseCcByNc')}</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClass}>{t('upload.tagsCommaSeparated')}</label>
          <input type="text" aria-label={t('upload.tagsCommaSeparated')} value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} className={inputClass} placeholder={t('upload.placeholderTags')} />
        </div>
      </section>

      <div className="pt-4 flex justify-end">
        <button type="submit" disabled={loading} className="w-full md:w-auto bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] shadow-[0_1px_0_var(--color-outline)] font-mono text-xs uppercase tracking-widest px-12 py-4 rounded-sm hover:bg-[var(--color-primary-container)] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
          {loading ? (
            <>
              <Spinner className="size-5" />
              {t('common.loading')}
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">publish</span>
              {t('upload.submit')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
