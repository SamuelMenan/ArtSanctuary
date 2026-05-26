'use client';

import { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import ArtworkGrid from '@/components/ui/ArtworkGrid';
import ArtworkModal from '@/components/ui/ArtworkModal';
import { usePreferences } from '@/components/AppPreferencesProvider';
import { getCategoryLabel } from '@/lib/i18n';

function ExploreContent() {
  const { push } = useRouter();
  const searchParams = useSearchParams();
  const { locale, t } = usePreferences();

  // Estados de Búsqueda y Filtros
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'todas');
  const [medium, setMedium] = useState(searchParams.get('medium') || '');
  const [technique, setTechnique] = useState(searchParams.get('technique') || '');
  const [tags, setTags] = useState(searchParams.get('tags') || '');

  // Estados de Datos
  const [results, setResults] = useState<any[]>([]);
  const [trendingData, setTrendingData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const initialLoadingRef = useRef(true);

  const [showFilters, setShowFilters] = useState(false);
  const urlArtworkId = searchParams.get('artworkId');
  const [directArtworkOpen, setDirectArtworkOpen] = useState(urlArtworkId);

  useEffect(() => {
    if (urlArtworkId) {
      setDirectArtworkOpen(urlArtworkId);
    }
  }, [urlArtworkId]);

  // Debounce hook customizado o implementado aquí para la búsqueda
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch('/api/explore/trending');
        const data = await res.json();
        setTrendingData(data);
      } catch (err) {
        console.error(err);
      } finally {
        initialLoadingRef.current = false;
      }
    };
    fetchTrending();
  }, []);

  const performSearch = useCallback(async () => {
    // Si no hay filtros activos ni búsqueda, no buscamos
    if (!query && category === 'todas' && !medium && !technique && !tags) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (category !== 'todas') params.set('category', category);
      if (medium) params.set('medium', medium);
      if (technique) params.set('technique', technique);
      if (tags) params.set('tags', tags);

      // Actualizar URL sin recargar
      push(`/explore?${params.toString()}`, { scroll: false });

      const res = await fetch(`/api/artworks/search?${params.toString()}`);
      const data = await res.json();
      setResults(data.artworks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [query, category, medium, technique, tags, push]);

  // Ejecutar búsqueda con debounce cuando cambian los filtros
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch();
    }, 400); // 400ms debounce

    return () => clearTimeout(timeoutId);
  }, [query, category, medium, technique, tags, performSearch]);

  const clearFilters = () => {
    setQuery('');
    setCategory('todas');
    setMedium('');
    setTechnique('');
    setTags('');
    push('/explore', { scroll: false });
  };

  const hasActiveSearch = query || category !== 'todas' || medium || technique || tags;

  return (
    <div className="w-full max-w-[1400px] mx-auto z-10 relative px-4 md:px-0 py-8">
      
      {/* HEADER BÚSQUEDA */}
      <header className="mb-10 sticky top-16 md:top-0 bg-background/95 backdrop-blur-md z-40 py-4 border-b border-[var(--color-outline-variant)]">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[var(--color-on-surface-variant)]">search</span>
            <input 
              type="text" 
              placeholder={t('explore.placeholder')} 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[var(--color-surface-container)] border border-[var(--color-surface-container-high)] rounded-full pl-12 pr-4 py-4 text-[var(--color-primary)] text-lg focus:outline-none focus:border-[var(--color-primary)] transition-colors font-sans"
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`shrink-0 flex items-center gap-2 font-mono text-xs uppercase tracking-widest px-6 py-4 rounded-full border transition-colors ${showFilters ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[var(--color-outline)] shadow-[0_1px_0_var(--color-outline)]' : 'bg-transparent text-[var(--color-primary)] border-[var(--color-outline-variant)] hover:border-[var(--color-primary)]'}`}
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            {t('explore.filters')}
          </button>
        </div>

        {/* FILTROS DESPLEGABLES */}
        {showFilters && (
          <div className="mt-4 p-6 bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] rounded-sm grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)]">{t('explore.category')}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] px-3 py-2 text-sm text-[var(--color-primary)] font-sans focus:outline-none focus:border-[var(--color-primary)] cursor-pointer">
                <option value="todas">{t('gallery.all')}</option>
                <option value="pintura">{getCategoryLabel(locale, 'pintura')}</option>
                <option value="escultura">{getCategoryLabel(locale, 'escultura')}</option>
                <option value="ilustracion">{getCategoryLabel(locale, 'ilustracion')}</option>
                <option value="fotografia">{getCategoryLabel(locale, 'fotografia')}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)]">{t('explore.techLabel')}</label>
              <input type="text" value={technique} onChange={(e) => setTechnique(e.target.value)} className="w-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] px-3 py-2 text-sm text-[var(--color-primary)] font-sans focus:outline-none focus:border-[var(--color-primary)]" />
            </div>
            <div className="space-y-2">
              <label className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)]">{t('explore.mediumLabel')}</label>
              <input type="text" value={medium} onChange={(e) => setMedium(e.target.value)} className="w-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] px-3 py-2 text-sm text-[var(--color-primary)] font-sans focus:outline-none focus:border-[var(--color-primary)]" />
            </div>
            <div className="flex items-end">
              <button onClick={clearFilters} className="w-full font-mono text-[10px] uppercase tracking-widest px-4 py-3 border border-[var(--color-error)] text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors">
                {t('explore.clearFilters')}
              </button>
            </div>
          </div>
        )}

        {/* CHIPS DE FILTROS ACTIVOS */}
        {hasActiveSearch && (
          <div className="flex flex-wrap gap-2 mt-4">
            {query && <span className="inline-flex items-center gap-1 bg-[var(--color-surface-container)] px-3 py-1 rounded-full text-xs font-mono border border-[var(--color-outline-variant)] text-[var(--color-primary)]">"{query}"</span>}
            {category !== 'todas' && <span className="inline-flex items-center gap-1 bg-[var(--color-surface-container)] px-3 py-1 rounded-full text-xs font-mono border border-[var(--color-outline-variant)] text-[var(--color-primary)] uppercase">{getCategoryLabel(locale, category)}</span>}
            {technique && <span className="inline-flex items-center gap-1 bg-[var(--color-surface-container)] px-3 py-1 rounded-full text-xs font-mono border border-[var(--color-outline-variant)] text-[var(--color-primary)]">{t('explore.technique')}: {technique}</span>}
            {medium && <span className="inline-flex items-center gap-1 bg-[var(--color-surface-container)] px-3 py-1 rounded-full text-xs font-mono border border-[var(--color-outline-variant)] text-[var(--color-primary)]">{t('explore.medium')}: {medium}</span>}
            {tags && <span className="inline-flex items-center gap-1 bg-[var(--color-surface-container)] px-3 py-1 rounded-full text-xs font-mono border border-[var(--color-outline-variant)] text-[var(--color-primary)]">{t('explore.tag')}: {tags}</span>}
          </div>
        )}
      </header>

      {/* ESTADO 1: RESULTADOS DE BÚSQUEDA */}
      {hasActiveSearch ? (
        <div>
          {loading ? (
            <div className="flex justify-center py-20">
              <span className="material-symbols-outlined animate-spin text-4xl text-[var(--color-primary)]">refresh</span>
            </div>
          ) : results.length > 0 ? (
            <ArtworkGrid artworks={results} />
          ) : (
            <div className="w-full flex flex-col items-center justify-center py-32 bg-[var(--color-surface-container-lowest)] border border-dashed border-[var(--color-outline-variant)] rounded-sm">
              <span className="material-symbols-outlined text-4xl text-[var(--color-on-surface-variant)] mb-4 opacity-50">search_off</span>
              <h3 className="font-sans font-semibold text-xl text-[var(--color-primary)] mb-2">{t('explore.noResultsTitle')}</h3>
              <p className="font-sans text-[var(--color-on-surface-variant)] text-center max-w-md">
                {t('explore.noResultsBody')}
              </p>
              <button onClick={clearFilters} className="mt-6 font-mono text-xs uppercase tracking-widest text-[var(--color-primary)] underline hover:text-[var(--color-primary-fixed)]">
                {t('common.clearFilters')}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ESTADO 2: EMPTY STATE INTELIGENTE (TENDENCIAS) */
        <div className="animate-in fade-in duration-500">
          {!trendingData ? (
             <div className="flex justify-center py-20">
               <span className="material-symbols-outlined animate-spin text-4xl text-[var(--color-primary)]">refresh</span>
             </div>
          ) : (
            <div className="space-y-16">
              
              {/* Sección: Sugerencias */}
              <section>
                <h2 className="font-sans font-semibold text-2xl text-[var(--color-primary)] mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined">trending_up</span> {t('explore.whatExplore')}
                </h2>
                <div className="flex flex-wrap gap-3">
                  {trendingData.trendingTags.map((tag: string) => (
                    <button 
                      key={tag} 
                      onClick={() => setQuery(tag)}
                      className="font-mono text-xs uppercase tracking-widest border border-[var(--color-outline-variant)] px-4 py-2 text-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)] hover:border-[var(--color-primary)] transition-colors rounded-sm"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </section>

              {/* Sección: Categorías */}
              <section>
                <h2 className="font-sans font-semibold text-xl text-[var(--color-primary)] mb-6 border-b border-[var(--color-outline-variant)] pb-2">
                  {t('explore.disciplines')}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {trendingData.categories.map((cat: any) => (
                    <button 
                      key={cat.name} 
                      onClick={() => { setCategory(cat.name); window.scrollTo({ top: 0 }); }}
                      className="flex flex-col items-start p-4 border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] hover:border-[var(--color-primary)] transition-colors rounded-sm text-left"
                    >
                      <span className="font-mono text-sm uppercase tracking-widest text-[var(--color-primary)] mb-1">{cat.name}</span>
                        <span className="font-sans text-xs text-[var(--color-on-surface-variant)]">{cat.count} {t('explore.worksRegistered')}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Sección: Novedades (Si hay) */}
              {trendingData.recentArtworks.length > 0 && (
                <section>
                  <h2 className="font-sans font-semibold text-xl text-[var(--color-primary)] mb-6 border-b border-[var(--color-outline-variant)] pb-2">
                    {t('explore.recentRecords')}
                  </h2>
                  <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
                    {trendingData.recentArtworks.map((art: any) => (
                      <div 
                        key={art._id.toString()} 
                        onClick={() => setDirectArtworkOpen(art._id.toString())}
                        className="snap-start shrink-0 w-64 group cursor-pointer relative"
                      >
                        <div className="aspect-square bg-[var(--color-surface-container-low)] overflow-hidden rounded-sm border border-[var(--color-outline-variant)] group-hover:border-[var(--color-primary)] transition-colors">
                           <Image src={art.imageUrl} alt={art.title} width={256} height={256} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                        </div>
                        <div className="mt-3">
                          <h3 className="font-sans font-semibold text-sm text-[var(--color-primary)] truncate">{art.title}</h3>
                          <p className="font-mono text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-widest mt-1">{art.artistId?.displayName || art.artistId?.username || t('explore.authorUnknown')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            </div>
          )}
        </div>
      )}

      {directArtworkOpen && (
        <ArtworkModal
          artworkId={directArtworkOpen}
          isOpen={true}
          onClose={() => setDirectArtworkOpen(null)}
        />
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-20 text-center font-mono">Cargando explorador…</div>}>
        <ExploreContent />
      </Suspense>
    </AppShell>
  );
}
