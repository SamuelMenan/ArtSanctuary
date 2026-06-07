'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider';
import {
  useArtworkAutoFill,
  getPresets,
  type ArtworkCategory,
} from '@shared/lib/useArtworkAutoFill';
import { uploadBlob } from '@shared/lib/image/canvas';

export type DateType = 'exact' | 'year' | 'monthyear' | 'range' | 'approx';

export function useUploadArtwork() {
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

  const [userAcceptedFields, setUserAcceptedFields] = useState<Record<string, boolean>>({});

  const acceptedFields = useMemo(() => {
    const next: Record<string, boolean> = { ...userAcceptedFields };
    suggestions.forEach(s => {
      if (!(s.field in next)) {
        next[s.field] = s.confidence > 0.8;
      }
    });
    return next;
  }, [suggestions, userAcceptedFields]);

  const setAcceptedFields = (val: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => {
    setUserAcceptedFields(typeof val === 'function' ? val(acceptedFields) : val);
  };

  // Auto-switch category when inferred (only if user hasn't manually changed yet — heuristic: still default pintura)
  useEffect(() => {
    if (inferredCategory && inferredCategory !== formData.category && formData.category === 'pintura') {
      setFormData(prev => ({ ...prev, category: inferredCategory }));
    }
    return () => {};
  }, [inferredCategory, formData.category]);

  const presets = useMemo(() => getPresets(formData.category), [formData.category]);
  const showDepth = formData.category === 'escultura';
  const dimensionUnitOptions = formData.category === 'fotografia'
    ? ['px', 'cm', 'in']
    : ['cm', 'in'];

  const processFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError(t('upload.fileTooBig'));
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
          (next as Record<string, unknown>)[s.field] = s.value;
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
      const materialsArray = formData.materials.split(',').flatMap(m => m.trim() ? [m.trim()] : []);
      const tagsArray = formData.tags.split(',').flatMap(s => s.trim() ? [s.trim()] : []);

      if (!imageFile) {
        throw new Error(t('upload.noImage'));
      }

      // Comprime (WebP, ≤4096px) antes de subir: evita 413 y reduce storage.
      const imageUrl = await uploadBlob(imageFile, 'artwork');

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
        throw new Error(errorData?.error?.message || t('upload.uploadArtworkError'));
      }

      router.push('/profile');
      router.refresh();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
}
