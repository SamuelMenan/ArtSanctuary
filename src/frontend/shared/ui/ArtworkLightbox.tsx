/* eslint-disable @typescript-eslint/no-explicit-any -- 'artwork' es JSON poblado del API con forma dinámica. */
'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ArtworkModal from './ArtworkModal';

/**
 * Isla cliente del grid: abre el modal según `?art=<id>` en la URL. Mantiene el
 * grid (tarjetas) como Server Component; solo este overlay lleva JS al cliente.
 */
function ArtworkLightboxInner({ artworks }: { artworks: any[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const artId = searchParams.get('art');
  const idx = artId ? artworks.findIndex((a) => a._id.toString() === artId) : -1;
  if (idx < 0) return null;

  const go = (id: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('art', id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };
  const close = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('art');
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <ArtworkModal
      artworkId={artworks[idx]._id.toString()}
      isOpen
      onClose={close}
      onPrev={idx > 0 ? () => go(artworks[idx - 1]._id.toString()) : undefined}
      onNext={idx < artworks.length - 1 ? () => go(artworks[idx + 1]._id.toString()) : undefined}
      onUpdated={() => router.refresh()}
    />
  );
}

export default function ArtworkLightbox({ artworks }: { artworks: any[] }) {
  return (
    <Suspense fallback={null}>
      <ArtworkLightboxInner artworks={artworks} />
    </Suspense>
  );
}
