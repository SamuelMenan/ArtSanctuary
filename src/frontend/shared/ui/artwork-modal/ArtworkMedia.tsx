/* eslint-disable @typescript-eslint/no-explicit-any -- 'artwork' es JSON poblado del API con forma dinámica; el tipado estricto cascada sin valor real aquí. */
'use client';

import Image from 'next/image';

interface ArtworkMediaProps {
  artwork: any;
}

export default function ArtworkMedia({ artwork }: ArtworkMediaProps) {
  return (
    /* LADO IZQUIERDO: IMAGEN (70% en desktop) */
    <div className="w-full md:w-[70%] h-[50vh] md:h-full bg-[var(--color-surface-container-low)] relative flex items-center justify-center group overflow-hidden p-4 md:p-8">
      <Image
        src={artwork.imageUrl}
        alt={artwork.title}
        fill
        sizes="(max-width: 768px) 100vw, 70vw"
        className="object-contain group-hover:scale-105 transition-transform duration-700"
      />
      <div className="absolute inset-0 border border-transparent group-hover:border-[var(--color-primary)]/30 pointer-events-none transition-colors duration-500"></div>
    </div>
  );
}
