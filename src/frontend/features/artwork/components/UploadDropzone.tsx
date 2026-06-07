'use client';

import NextImage from 'next/image';
import Spinner from '@frontend/shared/ui/Spinner';
import type { useUploadArtwork } from '../hooks/useUploadArtwork';

type UploadArtwork = ReturnType<typeof useUploadArtwork>;

interface UploadDropzoneProps {
  t: UploadArtwork['t'];
  error: string;
  imagePreview: string | null;
  imageFile: File | null;
  isDragging: boolean;
  suggestions: UploadArtwork['suggestions'];
  isAnalyzing: boolean;
  hasExif: boolean;
  category: string;
  acceptedFields: Record<string, boolean>;
  setAcceptedFields: UploadArtwork['setAcceptedFields'];
  handleImageChange: UploadArtwork['handleImageChange'];
  handleDragOver: UploadArtwork['handleDragOver'];
  handleDragLeave: UploadArtwork['handleDragLeave'];
  handleDrop: UploadArtwork['handleDrop'];
  applySelected: UploadArtwork['applySelected'];
}

export default function UploadDropzone({
  t,
  error,
  imagePreview,
  imageFile,
  isDragging,
  suggestions,
  isAnalyzing,
  hasExif,
  category,
  acceptedFields,
  setAcceptedFields,
  handleImageChange,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  applySelected,
}: UploadDropzoneProps) {
  return (
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
                <label className="font-mono text-label-sm uppercase tracking-widest text-[var(--color-primary)] border border-[var(--color-primary)] px-6 py-2 cursor-pointer hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)] transition-colors">
                  {t('upload.changeImage')}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
            </>
          ) : (
            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-6 text-center">
              <span className="material-symbols-outlined text-4xl text-[var(--color-on-surface-variant)] mb-4">add_photo_alternate</span>
              <span className="font-mono text-label-sm uppercase tracking-widest text-[var(--color-primary)] mb-2">{t('upload.selectFile')}</span>
              <span className="font-sans text-xs text-[var(--color-on-surface-variant)]">{t('upload.fileInfo')}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          )}
        </div>

        {/* AUTO-FILL BLOCK */}
        {imageFile && (isAnalyzing || suggestions.length > 0) && (
          <div className="mt-4 p-4 border border-[var(--color-primary)] bg-[var(--color-primary)]/5 rounded-sm">
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-primary)] mb-3 flex items-center gap-2">
              {isAnalyzing ? (
                <Spinner className="size-3.5" />
              ) : (
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              )}
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
                        aria-label={t(s.label)}
                        checked={!!acceptedFields[s.field]}
                        onChange={e => setAcceptedFields(prev => ({ ...prev, [s.field]: e.target.checked }))}
                        className="mt-0.5 accent-[var(--color-primary)]"
                      />
                      <label htmlFor={`sug-${s.field}`} className="flex-1 cursor-pointer text-[var(--color-on-surface-variant)]">
                        <strong className="text-[var(--color-primary)]">{t(s.label)}:</strong> {s.value.startsWith('presets.') ? t(s.value) : s.value} <span className="ml-1 opacity-60 font-mono text-[9px] uppercase">[{s.source}]</span>
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

            {!isAnalyzing && !hasExif && category === 'fotografia' && (
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
  );
}
