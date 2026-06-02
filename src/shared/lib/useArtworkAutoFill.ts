'use client';

import { useEffect, useState } from 'react';
import exifr from 'exifr';

export type ArtworkCategory = 'pintura' | 'escultura' | 'ilustracion' | 'fotografia' | 'otro';

export interface Suggestion {
  field: string;
  value: string;
  label: string;
  confidence: number;
  source: 'exif' | 'inferred' | 'contextual';
}

export interface AutoFillResult {
  suggestions: Suggestion[];
  inferredCategory: ArtworkCategory | null;
  isAnalyzing: boolean;
  hasExif: boolean;
}

const MEDIUM_PRESETS: Record<ArtworkCategory, string[]> = {
  pintura: ['presets.medium.oil', 'presets.medium.acrylic', 'presets.medium.watercolor', 'presets.medium.tempera'],
  escultura: ['presets.medium.bronze', 'presets.medium.marble', 'presets.medium.clay', 'presets.medium.wood', 'presets.medium.resin', 'presets.medium.steel'],
  ilustracion: ['presets.medium.digital', 'presets.medium.ink', 'presets.medium.digitalWatercolor', 'presets.medium.colorPencil'],
  fotografia: ['presets.medium.digitalPrint', 'presets.medium.film35mm', 'presets.medium.giclee', 'presets.medium.polaroid'],
  otro: [],
};

const TECHNIQUE_PRESETS: Record<ArtworkCategory, string[]> = {
  pintura: ['presets.technique.brush', 'presets.technique.spatula', 'presets.technique.impasto', 'presets.technique.glaze'],
  escultura: ['presets.technique.casting', 'presets.technique.carving', 'presets.technique.modeling', 'presets.technique.welding'],
  ilustracion: ['presets.technique.vector', 'presets.technique.raster', 'presets.technique.mixed', 'presets.technique.cleanLine'],
  fotografia: ['presets.technique.longExposure', 'presets.technique.hdr', 'presets.technique.macro', 'presets.technique.portrait'],
  otro: [],
};

const TAG_PRESETS: Record<ArtworkCategory, string[]> = {
  pintura: ['pintura', 'arte-tradicional'],
  escultura: ['escultura', 'tridimensional'],
  ilustracion: ['ilustración', 'arte-digital'],
  fotografia: ['fotografía', 'imagen'],
  otro: [],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- EXIF: esquema externo dinámico
export function inferCategoryFromExif(exif: any, fileName: string): ArtworkCategory | null {
  if (exif?.Make || exif?.Model || exif?.LensModel || exif?.FNumber || exif?.ISOSpeedRatings) {
    return 'fotografia';
  }
  const lower = fileName.toLowerCase();
  if (/sculpt|escultu|3d/.test(lower)) return 'escultura';
  if (/illust|ilust|draw|sketch/.test(lower)) return 'ilustracion';
  if (/paint|pintu|oil|acryl/.test(lower)) return 'pintura';
  if (/photo|foto|img|dsc/.test(lower)) return 'fotografia';
  return null;
}

function formatExifDate(d: Date | string | undefined): string | null {
  if (!d) return null;
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

export function buildSuggestions(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- EXIF dinámico
  exif: any,
  category: ArtworkCategory,
  fileName: string,
  imageDims?: { width: number; height: number }
): Suggestion[] {
  const out: Suggestion[] = [];

  if (category === 'fotografia' && exif) {
    const dateStr = formatExifDate(exif.DateTimeOriginal || exif.CreateDate);
    if (dateStr) {
      out.push({ field: 'dateValue', value: dateStr, label: 'presets.label.captureDate', confidence: 0.95, source: 'exif' });
      out.push({ field: 'dateType', value: 'exact', label: 'presets.label.dateType', confidence: 0.95, source: 'exif' });
    }
    if (exif.Make || exif.Model) {
      const camera = [exif.Make, exif.Model].filter(Boolean).join(' ').trim();
      if (camera) out.push({ field: 'technique', value: camera, label: 'presets.label.camera', confidence: 0.9, source: 'exif' });
    }
    if (exif.Copyright) {
      out.push({ field: 'copyrightHolder', value: String(exif.Copyright), label: 'presets.label.copyright', confidence: 0.9, source: 'exif' });
    }
    if (exif.ImageDescription) {
      out.push({ field: 'altText', value: String(exif.ImageDescription), label: 'presets.label.description', confidence: 0.7, source: 'exif' });
    }
    if (exif.FNumber || exif.ISO || exif.ISOSpeedRatings || exif.FocalLength) {
      const parts: string[] = [];
      if (exif.FocalLength) parts.push(`${Math.round(exif.FocalLength)}mm`);
      if (exif.FNumber) parts.push(`f/${exif.FNumber}`);
      if (exif.ExposureTime) parts.push(`${exif.ExposureTime < 1 ? `1/${Math.round(1 / exif.ExposureTime)}` : exif.ExposureTime}s`);
      const iso = exif.ISO || exif.ISOSpeedRatings;
      if (iso) parts.push(`ISO ${iso}`);
      if (parts.length) {
        out.push({ field: 'description', value: parts.join(' · '), label: 'presets.label.technical', confidence: 0.6, source: 'exif' });
      }
    }
    if (imageDims) {
      out.push({ field: 'dimWidth', value: String(imageDims.width), label: 'presets.label.widthPx', confidence: 0.85, source: 'exif' });
      out.push({ field: 'dimHeight', value: String(imageDims.height), label: 'presets.label.heightPx', confidence: 0.85, source: 'exif' });
      out.push({ field: 'dimUnit', value: 'px', label: 'presets.label.unit', confidence: 0.85, source: 'exif' });
    }
    out.push({ field: 'medium', value: 'presets.medium.digitalPrint', label: 'presets.label.suggestedMedium', confidence: 0.5, source: 'contextual' });
  }

  if (category !== 'fotografia' && category !== 'otro') {
    const tags = TAG_PRESETS[category];
    if (tags.length) {
      out.push({ field: 'tags', value: tags.join(', '), label: 'presets.label.baseTags', confidence: 0.6, source: 'contextual' });
    }
  }

  return out;
}

export function getPresets(category: ArtworkCategory) {
  return {
    mediums: MEDIUM_PRESETS[category] || [],
    techniques: TECHNIQUE_PRESETS[category] || [],
  };
}

export function useArtworkAutoFill(file: File | null, category: ArtworkCategory): AutoFillResult {
  const [exifData, setExifData] = useState<Record<string, unknown> | null>(null);
  const [imageDims, setImageDims] = useState<{ width: number; height: number } | undefined>();
  const [inferredCategory, setInferredCategory] = useState<ArtworkCategory | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasExif, setHasExif] = useState(false);

  useEffect(() => {
    if (!file) {
      setExifData(null);
      setImageDims(undefined);
      setInferredCategory(null);
      setHasExif(false);
      return;
    }

    let cancelled = false;
    setIsAnalyzing(true);

    (async () => {
      try {
        const exif = await exifr.parse(file).catch(() => null);
        const dims = await new Promise<{ width: number; height: number } | undefined>(resolve => {
          const img = new Image();
          const url = URL.createObjectURL(file);
          img.onload = () => {
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
            URL.revokeObjectURL(url);
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(undefined);
          };
          img.src = url;
        });

        if (cancelled) return;

        setExifData(exif);
        setImageDims(dims);
        setHasExif(!!exif && Object.keys(exif).length > 0);
        setInferredCategory(inferCategoryFromExif(exif, file.name));
      } finally {
        if (!cancelled) setIsAnalyzing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file]);

  const suggestions = buildSuggestions(exifData, category, file?.name || '', imageDims);

  return { suggestions, inferredCategory, isAnalyzing, hasExif };
}
