import { useCallback, useState } from 'react';
import { compressImage } from '@shared/lib/image/canvas';

export type CompressionResult = {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  /** Tamaño final como % del original (para la barra de progreso). */
  ratio: number;
};

/**
 * Wrapper de UI sobre {@link compressImage}: expone estado `compressing`/`error`
 * y el ratio para mostrar el ahorro. La lógica real (Pica + WebP + alpha) vive
 * en `shared/lib/image/canvas` y se comparte con crop/cutout/boards/artwork.
 */
export function useImageCompression() {
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compress = useCallback(async (file: File): Promise<CompressionResult | null> => {
    setError(null);
    setCompressing(true);
    try {
      const { blob, originalSize, compressedSize } = await compressImage(file);
      return {
        blob,
        originalSize,
        compressedSize,
        ratio: originalSize > 0 ? Math.round((compressedSize / originalSize) * 100) : 100,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compression failed');
      return null;
    } finally {
      setCompressing(false);
    }
  }, []);

  return { compress, compressing, error };
}
