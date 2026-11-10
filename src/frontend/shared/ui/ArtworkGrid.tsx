/* eslint-disable @typescript-eslint/no-explicit-any -- 'artwork' es JSON poblado del API con forma dinámica; el tipado estricto cascada sin valor real aquí. */
import ArtworkCard from './ArtworkCard';
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--spacing-grid-gutter)] flex-1">
        {artworks.map((art) => (
          <ArtworkCard
            key={art._id.toString()}
            href={`?art=${art._id.toString()}`}
            scroll={false}
            imageUrl={art.imageUrl}
            title={art.title}
            category={getCategoryLabel(locale, art.category)}
            subtitle={art.artistId?.displayName || art.artistId?.username || authorUnknown}
            likes={art.likes ?? 0}
          />
        ))}
      </div>

      <ArtworkLightbox artworks={artworks} />
    </>
  );
}
