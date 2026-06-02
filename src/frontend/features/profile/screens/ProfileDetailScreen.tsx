import AppShell from '@frontend/shared/layouts/AppShell'
import { auth } from '@backend/auth'
import { notFound } from 'next/navigation'
import { getUserById } from '@backend/services/users.service'
import { getArtworksByArtist } from '@backend/services/artworks.service'
import ArtworkGrid from '@frontend/shared/ui/ArtworkGrid'
import FollowButton from '@frontend/shared/ui/FollowButton'
import { ProfileHero } from '@frontend/features/profile/ProfileHero'
import { ProfileMetaBlock } from '@frontend/features/profile/ProfileMetaBlock'
import { ArtworkSectionHeader } from '@frontend/features/profile/ArtworkSectionHeader'
import { EmptyPortfolio } from '@frontend/features/profile/EmptyPortfolio'
import { createTranslator } from '@shared/i18n'
import { getDictionary } from '@shared/i18n/dictionaries'
import { getRequestLocale } from '@backend/requestPreferences'
import Image from 'next/image'

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [{ id }, session, locale] = await Promise.all([
    params,
    auth(),
    getRequestLocale(),
  ])
  const t = createTranslator(getDictionary(locale))

  const user = await getUserById(id)
  if (!user) return notFound()

  const userId = user._id.toString()
  const isOwner = session?.user?.id === userId
  const followersCount = user.followers?.length || 0
  const followingCount = user.following?.length || 0

  const isFollowing = session?.user?.id
    ? user.followers?.map((f: { toString: () => string }) => f.toString()).includes(session.user.id)
    : false

  const isMutual =
    session?.user?.id && isFollowing
      ? user.following?.map((f: { toString: () => string }) => f.toString()).includes(session.user.id)
      : false

  const profilePublic = user.privacySettings?.profilePublic ?? true
  const showEmail = user.privacySettings?.showEmail ?? false

  const name = user.displayName || user.username
  const initial = (name || 'U').charAt(0).toUpperCase()

  // Private profile minimal card
  if (!profilePublic && !isOwner) {
    return (
      <AppShell>
        <div className="w-full max-w-[1300px] mx-auto pt-2 pb-16 px-4 lg:px-0">
          <header className="border-b border-[var(--color-outline-variant)] pb-6 mb-12">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-on-surface-variant)] opacity-80">
              ARTISTA
            </span>
          </header>
          <div className="flex flex-col sm:flex-row gap-8 items-start mb-16">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={`Avatar de ${name}`}
                width={140}
                height={140}
                className="size-[120px] sm:size-[140px] rounded-full border border-[var(--color-outline-variant)] object-cover bg-[var(--color-surface-container-low)]"
              />
            ) : (
              <div className="size-[120px] sm:size-[140px] rounded-full bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] flex items-center justify-center">
                <span className="font-sans text-6xl font-semibold text-[var(--color-primary)]">
                  {initial}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-4xl sm:text-5xl font-sans font-semibold text-[var(--color-primary)] tracking-tight leading-[1.05]">
                {name}
              </h1>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-on-surface-variant)] mt-3">
                @{user.username}
              </p>
            </div>
          </div>
          <div className="border border-dashed border-[var(--color-outline-variant)] rounded-sm p-12 text-center bg-[var(--color-surface-container-lowest)]">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-on-surface-variant)] opacity-70 block mb-3">
              ACCESO RESTRINGIDO
            </span>
            <h2 className="font-sans font-semibold text-2xl text-[var(--color-primary)] mb-3">
              {t('profile.privateProfile')}
            </h2>
            <p className="font-sans text-sm text-[var(--color-on-surface-variant)] max-w-md mx-auto leading-relaxed">
              {t('profile.privateProfileBody')}
            </p>
          </div>
        </div>
      </AppShell>
    )
  }

  const userArtworks = await getArtworksByArtist(user._id, { publicOnly: true })

  return (
    <AppShell>
      <div className="w-full max-w-[1300px] mx-auto pt-2 pb-16 px-4 lg:px-0">
        <ProfileHero
          userId={userId}
          name={name}
          username={user.username}
          avatarUrl={user.avatarUrl}
          plan={user.plan || 'free'}
          isOwner={isOwner}
          isMutual={!!isMutual}
          worksCount={userArtworks.length}
          followersCount={followersCount}
          followingCount={followingCount}
          email={user.email}
          showEmail={showEmail}
          eyebrow="ARTISTA"
          t={t}
          actions={
            !isOwner ? (
              <FollowButton targetUserId={userId} initialIsFollowing={isFollowing} />
            ) : undefined
          }
        />

        <ProfileMetaBlock
          bio={user.bio}
          location={user.location}
          website={user.website}
          createdAt={user.createdAt}
          socials={user.socials}
          locale={locale}
          t={t}
        />

        <ArtworkSectionHeader
          title={t('profile.portfolio')}
          count={userArtworks.length}
          t={t}
        />

        {userArtworks.length === 0 ? (
          <EmptyPortfolio ownerView={false} t={t} />
        ) : (
          <ArtworkGrid artworks={JSON.parse(JSON.stringify(userArtworks))} locale={locale} />
        )}
      </div>
    </AppShell>
  )
}
