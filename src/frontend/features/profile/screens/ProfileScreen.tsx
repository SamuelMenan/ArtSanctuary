import AppShell from '@frontend/shared/layouts/AppShell'
import { auth } from '@backend/auth'
import { redirect } from 'next/navigation'
import { connectDB } from '@backend/db/mongoose'
import Artwork from '@backend/models/Artwork'
import User from '@backend/models/User'
import Link from 'next/link'
import ArtworkGrid from '@frontend/shared/ui/ArtworkGrid'
import { ProfileHero } from '@frontend/features/profile/ProfileHero'
import { ProfileMetaBlock } from '@frontend/features/profile/ProfileMetaBlock'
import { ArtworkSectionHeader } from '@frontend/features/profile/ArtworkSectionHeader'
import { EmptyPortfolio } from '@frontend/features/profile/EmptyPortfolio'
import { createTranslator } from '@shared/i18n'
import { getDictionary } from '@shared/i18n/dictionaries'
import { getRequestLocale } from '@backend/requestPreferences'

export const metadata = {
  title: 'Mi Portfolio | ArtSanctuary',
  description: 'Tu portfolio personal en ArtSanctuary.',
}

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const locale = await getRequestLocale()
  const t = createTranslator(getDictionary(locale))

  await connectDB()
  const dbUser = await User.findById(session.user.id)
    .select(
      'username displayName bio avatarUrl location website socials plan followers following privacySettings createdAt',
    )
    .lean()

  if (!dbUser) redirect('/login')

  const userArtworks = await Artwork.find({ artistId: dbUser._id })
    .sort({ uploadDate: -1 })
    .lean()

  const userId = dbUser._id.toString()
  const name = dbUser.displayName || dbUser.username
  const followersCount = dbUser.followers?.length ?? 0
  const followingCount = dbUser.following?.length ?? 0

  const primaryBtn =
    'inline-flex items-center gap-1.5 bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-2 rounded-sm hover:bg-[var(--color-primary-container)] transition-colors'
  const ghostBtn =
    'inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] border border-[var(--color-outline-variant)] text-[var(--color-primary)] px-3 py-2 rounded-sm hover:border-[var(--color-primary)] transition-colors'

  return (
    <AppShell>
      <div className="w-full max-w-[1300px] mx-auto pt-2 pb-16 px-4 lg:px-0">
        <ProfileHero
          userId={userId}
          name={name}
          username={dbUser.username}
          avatarUrl={dbUser.avatarUrl}
          plan={dbUser.plan || 'free'}
          isOwner
          worksCount={userArtworks.length}
          followersCount={followersCount}
          followingCount={followingCount}
          eyebrow="TU SANTUARIO"
          t={t}
          actions={
            <>
              <Link href="/upload" className={primaryBtn}>
                <span aria-hidden>+</span>
                {t('home.uploadArtwork')}
              </Link>
              <Link href="/settings" className={ghostBtn}>
                {t('profile.editProfile')}
              </Link>
            </>
          }
        />

        <ProfileMetaBlock
          bio={dbUser.bio}
          location={dbUser.location}
          website={dbUser.website}
          createdAt={dbUser.createdAt}
          socials={dbUser.socials}
          locale={locale}
          t={t}
        />

        <ArtworkSectionHeader
          title={t('profile.portfolio')}
          count={userArtworks.length}
          t={t}
        />

        {userArtworks.length === 0 ? (
          <EmptyPortfolio ownerView t={t} />
        ) : (
          <ArtworkGrid artworks={JSON.parse(JSON.stringify(userArtworks))} />
        )}
      </div>
    </AppShell>
  )
}
