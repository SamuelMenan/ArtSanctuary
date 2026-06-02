import AppShell from '@frontend/shared/layouts/AppShell'
import Link from 'next/link'
import { getGalleryArtworks } from '@backend/services/artworks.service'
import ArtworkGrid from '@frontend/shared/ui/ArtworkGrid'
import { createTranslator, getCategoryLabel } from '@shared/i18n'
import { getDictionary } from '@shared/i18n/dictionaries'
import { getRequestLocale } from '@backend/requestPreferences'

// Definimos la interfaz para Next.js 13+ Server Components con searchParams
export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const locale = await getRequestLocale()
  const t = createTranslator(getDictionary(locale))

  // Leer la categoría actual de la URL (?category=pintura)
  const resolvedParams = await searchParams;
  const currentCategory = typeof resolvedParams?.category === 'string' ? resolvedParams.category.toLowerCase() : 'todas';

  const artworks = await getGalleryArtworks(currentCategory);

  const categories = [
    { label: t('gallery.all').toUpperCase(), value: 'todas' },
    { label: getCategoryLabel(locale, 'pintura').toUpperCase(), value: 'pintura' },
    { label: getCategoryLabel(locale, 'escultura').toUpperCase(), value: 'escultura' },
    { label: getCategoryLabel(locale, 'ilustracion').toUpperCase(), value: 'ilustracion' },
    { label: getCategoryLabel(locale, 'fotografia').toUpperCase(), value: 'fotografia' }
  ];

  return (
    <AppShell>
      <div className="pt-8 pb-12 w-full max-w-[1400px] mx-auto z-10 relative px-4 md:px-0">
        <header className="mb-12">
          <h1 className="font-display-lg text-display-lg text-[var(--color-primary)] font-semibold mb-8 tracking-[-0.02em] leading-[1.1]">
            {t('gallery.title')}
          </h1>
          <div className="flex flex-wrap gap-6 border-b border-[var(--color-outline-variant)] pb-4">
            {categories.map((cat) => {
              const isActive = currentCategory === cat.value;
              return (
                <Link 
                  key={cat.value}
                  href={`/gallery${cat.value === 'todas' ? '' : `?category=${cat.value}`}`}
                  className={`font-mono text-label-sm uppercase tracking-[0.05em] transition-colors pb-1 ${
                    isActive 
                    ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' 
                    : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]'
                  }`}
                >
                  {cat.label}
                </Link>
              )
            })}
          </div>
        </header>

        <ArtworkGrid
          locale={locale}
          artworks={JSON.parse(JSON.stringify(artworks))} // Fix para pasar lean objects a client component
          emptyState={
            <div className="w-full flex flex-col items-center justify-center py-32 bg-[var(--color-surface-container-lowest)] border border-dashed border-[var(--color-outline-variant)] rounded-sm">
              <span className="material-symbols-outlined text-4xl text-[var(--color-on-surface-variant)] mb-4 opacity-50">search_off</span>
              <h3 className="font-sans font-semibold text-xl text-[var(--color-primary)] mb-2">{t('gallery.noResults')}</h3>
              <p className="font-sans text-[var(--color-on-surface-variant)] text-center max-w-md">
                {t('gallery.noResultsBody', { category: getCategoryLabel(locale, currentCategory) })}
              </p>
            </div>
          }
        />
      </div>
    </AppShell>
  )
}