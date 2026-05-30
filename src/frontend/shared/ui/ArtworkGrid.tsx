'use client';

import { useState } from 'react';
import ArtworkModal from './ArtworkModal';
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider';
import { getCategoryLabel } from '@shared/i18n';

interface ArtworkGridProps {
  artworks: any[];
  emptyState?: React.ReactNode;
}

export default function ArtworkGrid({ artworks, emptyState }: ArtworkGridProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const { locale, t } = usePreferences();

  if (artworks.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const handleOpen = (idx: number) => setSelectedIdx(idx);
  const handleClose = () => setSelectedIdx(null);
  const handlePrev = () => {
    if (selectedIdx !== null && selectedIdx > 0) setSelectedIdx(selectedIdx - 1);
  };
  const handleNext = () => {
    if (selectedIdx !== null && selectedIdx < artworks.length - 1) setSelectedIdx(selectedIdx + 1);
  };

  return (
    <>
      <div className="masonry-grid flex-1">
        {artworks.map((art, idx) => (
          <article 
            key={art._id.toString()} 
            onClick={() => handleOpen(idx)}
            className="masonry-item relative group bg-[var(--color-surface-container-low)] cursor-pointer overflow-hidden rounded-[var(--radius-sm)] block mb-[var(--spacing-grid-gutter)]"
          >
            <img
              src={art.imageUrl}
              alt={art.title}
              loading="lazy"
              className="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.02]"
            />
            
            <div className="absolute inset-0 border border-transparent group-hover:border-[var(--color-primary)] transition-colors duration-300 pointer-events-none" />
            
            <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none">
              <h2 className="font-sans text-[var(--text-headline-md)] text-[var(--color-primary)] mb-1 font-semibold leading-[1.3] truncate">
                {art.title}
              </h2>
              <p className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] uppercase tracking-[0.05em] flex justify-between items-center">
                <span>{getCategoryLabel(locale, art.category)} · {art.artistId?.displayName || art.artistId?.username || t('common.authorUnknown')}</span>
                {art.likes > 0 && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">favorite</span> {art.likes}</span>}
              </p>
            </div>
          </article>
        ))}
      </div>

      {selectedIdx !== null && (
        <ArtworkModal
          artworkId={artworks[selectedIdx]._id.toString()}
          isOpen={selectedIdx !== null}
          onClose={handleClose}
          onPrev={selectedIdx > 0 ? handlePrev : undefined}
          onNext={selectedIdx < artworks.length - 1 ? handleNext : undefined}
          onUpdated={() => {
            // Ideally revalidate data here
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
