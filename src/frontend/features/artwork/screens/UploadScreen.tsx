'use client';

import AppShell from '@frontend/shared/layouts/AppShell';
import { useUploadArtwork } from '../hooks/useUploadArtwork';
import UploadDropzone from '../components/UploadDropzone';
import ArtworkForm from '../components/ArtworkForm';

export default function UploadArtworkPage() {
  const {
    t,
    loading,
    error,
    imagePreview,
    imageFile,
    formData,
    setFormData,
    isDragging,
    suggestions,
    isAnalyzing,
    hasExif,
    acceptedFields,
    setAcceptedFields,
    presets,
    showDepth,
    dimensionUnitOptions,
    handleImageChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    applySelected,
    applyPreset,
    handleSubmit,
  } = useUploadArtwork();

  return (
    <AppShell>
      <div className="w-full max-w-6xl mx-auto py-10 px-4 md:px-0 pb-24">
        <div className="mb-10 border-b border-[var(--color-outline-variant)] pb-6">
          <h1 className="font-sans font-bold text-3xl md:text-4xl text-[var(--color-primary)] tracking-tight mb-2">{t('upload.registerTitle')}</h1>
          <p className="font-sans text-[var(--color-on-surface-variant)] text-sm md:text-base">{t('upload.description')}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-12">
          {/* IMAGE COLUMN */}
          <UploadDropzone
            t={t}
            error={error}
            imagePreview={imagePreview}
            imageFile={imageFile}
            isDragging={isDragging}
            suggestions={suggestions}
            isAnalyzing={isAnalyzing}
            hasExif={hasExif}
            category={formData.category}
            acceptedFields={acceptedFields}
            setAcceptedFields={setAcceptedFields}
            handleImageChange={handleImageChange}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            handleDrop={handleDrop}
            applySelected={applySelected}
          />

          {/* METADATA COLUMN */}
          <ArtworkForm
            t={t}
            loading={loading}
            formData={formData}
            setFormData={setFormData}
            presets={presets}
            showDepth={showDepth}
            dimensionUnitOptions={dimensionUnitOptions}
            applyPreset={applyPreset}
          />
        </form>
      </div>
    </AppShell>
  );
}
