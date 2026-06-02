import { getCollectionById } from "@backend/services/collections.service";
import ArtworkGrid from "@frontend/shared/ui/ArtworkGrid";
import CollectionActions from "@frontend/shared/ui/CollectionActions";
import AppShell from "@frontend/shared/layouts/AppShell";
import { auth } from "@backend/auth";
import { getRequestLocale } from "@backend/requestPreferences";
import { notFound } from "next/navigation";
import { createTranslator } from "@shared/i18n";
import { getDictionary } from "@shared/i18n/dictionaries";

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const [resolvedParams, session, locale] = await Promise.all([
    params,
    auth(),
    getRequestLocale(),
  ]);
  const t = createTranslator(getDictionary(locale));

  const collection = await getCollectionById(resolvedParams.id);

  if (!collection) return notFound();
  
  const isOwner = session?.user?.id === collection.owner.toString();
  if (collection.isPrivate && !isOwner) {
    return (
      <AppShell>
        <div className="pt-8 pb-12 w-full max-w-[1400px] mx-auto z-10 relative px-4 md:px-0 flex items-center justify-center h-full">
          <p className="text-[var(--color-error)] font-mono uppercase tracking-widest">{t('common.privateCollection')}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="pt-8 pb-12 w-full max-w-[1400px] mx-auto z-10 relative px-4 md:px-0">
        <div className="border-b border-[var(--color-outline-variant)] pb-6 mb-8">
          {isOwner ? (
            <CollectionActions collectionId={collection._id.toString()} initialName={collection.name} />
          ) : (
            <h1 className="text-4xl font-display-lg tracking-[-0.02em] text-[var(--color-primary)] font-bold mb-2">
              {collection.name}
            </h1>
          )}
          <p className="font-mono text-label-sm text-[var(--color-on-surface-variant)] uppercase tracking-[0.05em] mt-2">
            {collection.artworks?.length || 0} obras guardadas
          </p>
        </div>
        
        {collection.artworks && collection.artworks.length > 0 ? (
          <ArtworkGrid
             locale={locale}
             artworks={JSON.parse(JSON.stringify(collection.artworks))}
          />
        ) : (
          <div className="text-center py-20 text-[var(--color-on-surface-variant)] font-mono text-sm uppercase tracking-widest border border-dashed border-[var(--color-outline-variant)] rounded-sm">
            Esta colección está vacía
          </div>
        )}
      </div>
    </AppShell>
  );
}
