/* eslint-disable @typescript-eslint/no-explicit-any -- 'artwork' es JSON poblado del API con forma dinámica; el tipado estricto cascada sin valor real aquí. */
import Link from 'next/link';
import ArtworkLightbox from './ArtworkLightbox';
import { getCategoryLabel, type Locale } from '@shared/i18n';

interface ArtworkGridProps {
  artworks: any[];
  locale: Locale;
  emptyState?: React.ReactNode;
}

/**
 * Grid de obras. Componente isomórfico SIN estado: las tarjetas son enlaces a
 * `?art=<id>` (renderizables en servidor, 0 JS). El modal lo abre la isla
 * cliente `ArtworkLightbox` leyendo ese query param.
 */
export default function ArtworkGrid({ artworks, locale, emptyState }: ArtworkGridProps) {
  if (artworks.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const authorUnknown = locale === 'en' ? 'Unknown author' : 'Autor desconocido';

  return (
    <>
      <div className="masonry-grid flex-1">
        {artworks.map((art) => (
          <Link
            key={art._id.toString()}
            href={`?art=${art._id.toString()}`}
            scroll={false}
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
              <h2 className="font-sans text-headline-md text-[var(--color-primary)] mb-1 font-semibold leading-[1.3] truncate">
                {art.title}
              </h2>
              <p className="font-mono text-label-sm text-[var(--color-on-surface-variant)] uppercase tracking-[0.05em] flex justify-between items-center">
                <span>{getCategoryLabel(locale, art.category)} · {art.artistId?.displayName || art.artistId?.username || authorUnknown}</span>
                {art.likes > 0 && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">favorite</span> {art.likes}</span>}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <ArtworkLightbox artworks={artworks} />
    </>
  );
}
