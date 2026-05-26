'use client';

import NextImage from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { usePreferences } from '@/components/AppPreferencesProvider';
import {
  useArtworkAutoFill,
  getPresets,
  type ArtworkCategory,
  type Suggestion,
} from '@/lib/useArtworkAutoFill';

type DateType = 'exact' | 'year' | 'monthyear' | 'range' | 'approx';

export default function UploadArtworkPage() {
  const router = useRouter();
  const { t } = usePreferences();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'pintura' as ArtworkCategory,
    description: '',
    dateType: 'year' as DateType,
    dateValue: new Date().getFullYear().toString(),
    dateCertainty: 'confirmed',
    medium: '',
    technique: '',
    materials: '',
    dimWidth: '',
    dimHeight: '',
    dimDepth: '',
    dimUnit: 'cm',
    tags: '',
    visibility: 'public',
    altText: '',
    copyrightHolder: '',
    licenseType: 'all-rights-reserved',
  });

  const [isDragging, setIsDragging] = useState(false);

  const { suggestions, inferredCategory, isAnalyzing, hasExif } = useArtworkAutoFill(
    imageFile,
    formData.category
  );

  const [acceptedFields, setAcceptedFields] = useState<Record<string, boolean>>({});

  // Default checked = high-confidence suggestions
  useEffect(() => {
    const next: Record<string, boolean> = {};
    suggestions.forEach(s => {
      next[s.field] = s.confidence > 0.8;
    });
    setAcceptedFields(next);
  }, [suggestions.length, imageFile?.name]);

  // Auto-switch category when inferred (only if user hasn't manually changed yet — heuristic: still default pintura)
  useEffect(() => {
    if (inferredCategory && inferredCategory !== formData.category && formData.category === 'pintura') {
      setFormData(prev => ({ ...prev, category: inferredCategory }));
    }
  }, [inferredCategory]);

  const presets = useMemo(() => getPresets(formData.category), [formData.category]);
  const showDepth = formData.category === 'escultura';
  const dimensionUnitOptions = formData.category === 'fotografia'
    ? ['px', 'cm', 'in']
    : ['cm', 'in'];

  const processFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen es demasiado grande. Máximo 10MB.');
      return;
    }
    setError('');
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => processFile(e.target.files?.[0]);
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  const applySelected = () => {
    setFormData(prev => {
      const next = { ...prev };
      suggestions.forEach(s => {
        if (!acceptedFields[s.field]) return;
        if (s.field in next) {
          (next as any)[s.field] = s.value;
        }
      });
      return next;
    });
  };

  const applyPreset = (field: 'medium' | 'technique', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!imagePreview) {
      setError(t('upload.noImage'));
      setLoading(false);
      return;
    }

    try {
      const materialsArray = formData.materials.split(',').map(m => m.trim()).filter(Boolean);
      const tagsArray = formData.tags.split(',').map(s => s.trim()).filter(Boolean);

      if (!imageFile) {
        throw new Error(t('upload.noImage'));
      }

      const uploadForm = new FormData();
      uploadForm.append('file', imageFile);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadForm });
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.error || 'Error al subir la imagen');
      }
      const { imageUrl } = await uploadRes.json();

      const payload = {
        title: formData.title,
        imageUrl,
        description: formData.description,
        category: formData.category,
        creationDate: { type: formData.dateType, value: formData.dateValue, certainty: formData.dateCertainty },
        medium: formData.medium,
        technique: formData.technique,
        materials: materialsArray,
        dimensions: {
          width: parseFloat(formData.dimWidth) || undefined,
          height: parseFloat(formData.dimHeight) || undefined,
          depth: showDepth ? (parseFloat(formData.dimDepth) || undefined) : undefined,
          unit: formData.dimUnit,
        },
        visibility: formData.visibility,
        altText: formData.altText,
        licenseRights: { copyrightHolder: formData.copyrightHolder, licenseType: formData.licenseType },
        tags: tagsArray,
      };

      const response = await fetch('/api/artworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al subir la obra');
      }

      router.push('/profile');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full bg-[var(--color-surface-container)] border border-[var(--color-surface-container-high)] rounded-sm px-4 py-3 text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors font-sans';
  const labelClass = 'font-mono text-[var(--text-label-sm)] uppercase tracking-widest text-[var(--color-on-surface-variant)]';

  return (
    <AppShell>
      <div className="w-full max-w-6xl mx-auto py-10 px-4 md:px-0 pb-24">
        <div className="mb-10 border-b border-[var(--color-outline-variant)] pb-6">
          <h1 className="font-sans font-bold text-3xl md:text-4xl text-[var(--color-primary)] tracking-tight mb-2">{t('upload.registerTitle')}</h1>
          <p className="font-sans text-[var(--color-on-surface-variant)] text-sm md:text-base">{t('upload.description')}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-12">
          {/* IMAGE COLUMN */}
          <div className="w-full lg:w-2/5 flex flex-col gap-6">
            <div className="sticky top-24">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full aspect-[4/5] border ${isDragging ? 'border-[var(--color-primary)] bg-[var(--color-surface-container)]' : 'border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)]'} rounded-sm flex flex-col items-center justify-center relative overflow-hidden group ${!imagePreview ? 'border-dashed hover:border-[var(--color-primary)] cursor-pointer transition-colors' : ''}`}
              >
                {imagePreview ? (
                  <>
                    <NextImage src={imagePreview} alt="Preview" width={400} height={400} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <label className="font-mono text-[var(--text-label-sm)] uppercase tracking-widest text-[var(--color-primary)] border border-[var(--color-primary)] px-6 py-2 cursor-pointer hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)] transition-colors">
                        {t('upload.changeImage')}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      </label>
                    </div>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-6 text-center">
                    <span className="material-symbols-outlined text-4xl text-[var(--color-on-surface-variant)] mb-4">add_photo_alternate</span>
                    <span className="font-mono text-[var(--text-label-sm)] uppercase tracking-widest text-[var(--color-primary)] mb-2">{t('upload.selectFile')}</span>
                    <span className="font-sans text-xs text-[var(--color-on-surface-variant)]">{t('upload.fileInfo')}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                )}
              </div>

              {/* AUTO-FILL BLOCK */}
              {imageFile && (isAnalyzing || suggestions.length > 0) && (
                <div className="mt-4 p-4 border border-[var(--color-primary)] bg-[var(--color-primary)]/5 rounded-sm">
                  <h4 className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-primary)] mb-3 flex items-center gap-2">
                    <span className={`material-symbols-outlined text-[14px] ${isAnalyzing ? 'animate-spin' : ''}`}>
                      {isAnalyzing ? 'refresh' : 'auto_awesome'}
                    </span>
                    {isAnalyzing ? t('upload.analyzing') : t('upload.detectedData')}
                  </h4>

                  {!isAnalyzing && suggestions.length > 0 && (
                    <>
                      <ul className="space-y-2 mb-3">
                        {suggestions.map(s => (
                          <li key={s.field} className="flex items-start gap-2 text-xs font-sans">
                            <input
                              type="checkbox"
                              id={`sug-${s.field}`}
                              checked={!!acceptedFields[s.field]}
                              onChange={e => setAcceptedFields(prev => ({ ...prev, [s.field]: e.target.checked }))}
                              className="mt-0.5 accent-[var(--color-primary)]"
                            />
                            <label htmlFor={`sug-${s.field}`} className="flex-1 cursor-pointer text-[var(--color-on-surface-variant)]">
                              <strong className="text-[var(--color-primary)]">{s.label}:</strong> {s.value}
                              <span className="ml-1 opacity-60 font-mono text-[9px] uppercase">[{s.source}]</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={applySelected}
                        className="w-full border border-[var(--color-primary)] text-[var(--color-primary)] font-mono text-[10px] uppercase py-2 hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)] transition-colors rounded-sm"
                      >
                        {t('upload.applySelected')}
                      </button>
                    </>
                  )}

                  {!isAnalyzing && !hasExif && formData.category === 'fotografia' && (
                    <p className="text-xs font-sans text-[var(--color-on-surface-variant)] mt-2">{t('upload.noMetadata')}</p>
                  )}
                </div>
              )}

              {error && <p className="font-sans text-sm text-[var(--color-error)] mt-4">{error}</p>}

              <div className="mt-6 p-4 bg-[var(--color-surface-container)] rounded-sm">
                <p className="font-mono text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  {t('upload.loadDate')}
                </p>
              </div>
            </div>
          </div>

          {/* METADATA COLUMN */}
          <div className="w-full lg:w-3/5 flex flex-col gap-8">
            {/* IDENTIFICATION */}
            <section className="space-y-6 border border-[var(--color-surface-container-high)] p-6 rounded-sm bg-[var(--color-surface-container-lowest)]">
              <h2 className="font-sans font-semibold text-lg text-[var(--color-primary)] flex items-center gap-2 border-b border-[var(--color-surface-container-high)] pb-2">
                <span className="material-symbols-outlined">label</span> {t('upload.identification')}
              </h2>

              <div className="space-y-2">
                <label className={labelClass}>{t('upload.title')}</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className={inputClass} placeholder="Ej. Ecos del Silencio" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={labelClass}>{t('upload.category')}</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as ArtworkCategory })} className={`${inputClass} appearance-none cursor-pointer`}>
                    <option value="pintura">Pintura</option>
                    <option value="escultura">Escultura</option>
                    <option value="ilustracion">Ilustración</option>
                    <option value="fotografia">Fotografía</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>{t('upload.visibility')}</label>
                  <select value={formData.visibility} onChange={e => setFormData({ ...formData, visibility: e.target.value })} className={`${inputClass} appearance-none cursor-pointer`}>
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
                  <select value={formData.dateType} onChange={e => setFormData({ ...formData, dateType: e.target.value as DateType })} className={`${inputClass} appearance-none cursor-pointer`}>
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
                    value={formData.dateValue}
                    onChange={e => setFormData({ ...formData, dateValue: e.target.value })}
                    className={inputClass}
                    placeholder={formData.dateType === 'range' ? 'Ej. 2020-2023' : formData.dateType === 'approx' ? 'Ej. c. 1998' : 'Ej. 2024'}
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
                  <input type="text" value={formData.medium} onChange={e => setFormData({ ...formData, medium: e.target.value })} className={inputClass} placeholder={presets.mediums[0] || 'Soporte / medio'} />
                  {presets.mediums.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {presets.mediums.map(m => (
                        <button key={m} type="button" onClick={() => applyPreset('medium', m)} className="font-mono text-[10px] border border-[var(--color-outline-variant)] px-2 py-1 rounded-sm hover:bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] transition-colors">
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>{t('upload.technique')}</label>
                  <input type="text" value={formData.technique} onChange={e => setFormData({ ...formData, technique: e.target.value })} className={inputClass} placeholder={presets.techniques[0] || 'Técnica'} />
                  {presets.techniques.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {presets.techniques.map(tk => (
                        <button key={tk} type="button" onClick={() => applyPreset('technique', tk)} className="font-mono text-[10px] border border-[var(--color-outline-variant)] px-2 py-1 rounded-sm hover:bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] transition-colors">
                          {tk}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClass}>{t('upload.dimensions')}</label>
                <div className="flex gap-2">
                  <input type="number" placeholder={t('upload.width')} value={formData.dimWidth} onChange={e => setFormData({ ...formData, dimWidth: e.target.value })} className={`${inputClass} text-center`} />
                  <span className="text-[var(--color-on-surface-variant)] flex items-center">x</span>
                  <input type="number" placeholder={t('upload.height')} value={formData.dimHeight} onChange={e => setFormData({ ...formData, dimHeight: e.target.value })} className={`${inputClass} text-center`} />
                  {showDepth && (
                    <>
                      <span className="text-[var(--color-on-surface-variant)] flex items-center">x</span>
                      <input type="number" placeholder={t('upload.depth')} value={formData.dimDepth} onChange={e => setFormData({ ...formData, dimDepth: e.target.value })} className={`${inputClass} text-center`} />
                    </>
                  )}
                  <select value={formData.dimUnit} onChange={e => setFormData({ ...formData, dimUnit: e.target.value })} className={`${inputClass} text-center cursor-pointer w-32`}>
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
                <textarea rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className={`${inputClass} resize-none`} placeholder="Contexto o concepto detrás de la obra..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={labelClass}>{t('upload.copyrightHolder')}</label>
                  <input type="text" value={formData.copyrightHolder} onChange={e => setFormData({ ...formData, copyrightHolder: e.target.value })} className={inputClass} placeholder="Autor / titular" />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>{t('upload.license')}</label>
                  <select value={formData.licenseType} onChange={e => setFormData({ ...formData, licenseType: e.target.value })} className={`${inputClass} appearance-none cursor-pointer`}>
                    <option value="all-rights-reserved">{t('upload.licenseAllRights')}</option>
                    <option value="cc-by">{t('upload.licenseCcBy')}</option>
                    <option value="cc-by-nc">{t('upload.licenseCcByNc')}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClass}>{t('upload.tagsCommaSeparated')}</label>
                <input type="text" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} className={inputClass} placeholder="paisaje, oscuro, melancolía" />
              </div>
            </section>

            <div className="pt-4 flex justify-end">
              <button type="submit" disabled={loading} className="w-full md:w-auto bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] shadow-[0_1px_0_var(--color-outline)] font-mono text-xs uppercase tracking-widest px-12 py-4 rounded-sm hover:bg-[var(--color-primary-container)] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">refresh</span>
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
        </form>
      </div>
    </AppShell>
  );
}
