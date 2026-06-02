import AppShell from '@frontend/shared/layouts/AppShell'
import { auth } from '@backend/auth'
import { redirect } from 'next/navigation'
import { getUserById } from '@backend/services/users.service'
import { createTranslator } from '@shared/i18n'
import { getDictionary } from '@shared/i18n/dictionaries'
import { getRequestLocale } from '@backend/requestPreferences'
import { AvatarUploader } from '@frontend/features/settings/AvatarUploader'
import { ProfileForm, type ProfileInitial } from '@frontend/features/settings/ProfileForm'
import { AccountForm } from '@frontend/features/settings/AccountForm'
import { AppearanceForm } from '@frontend/features/settings/AppearanceForm'
import { NotificationsForm } from '@frontend/features/settings/NotificationsForm'
import { PrivacyForm } from '@frontend/features/settings/PrivacyForm'
import { DangerZone } from '@frontend/features/settings/DangerZone'

export const metadata = {
  title: 'Configuración | ArtSanctuary',
  description: 'Ajustes de cuenta y perfil',
}

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const locale = await getRequestLocale()
  const t = createTranslator(getDictionary(locale))

  const dbUser = await getUserById(session.user.id)
  if (!dbUser) redirect('/login')

  const profile: ProfileInitial = {
    displayName: dbUser.displayName ?? '',
    username: dbUser.username ?? '',
    bio: dbUser.bio ?? '',
    location: dbUser.location ?? '',
    website: dbUser.website ?? '',
    socials: {
      twitter: dbUser.socials?.twitter ?? '',
      instagram: dbUser.socials?.instagram ?? '',
      behance: dbUser.socials?.behance ?? '',
      artstation: dbUser.socials?.artstation ?? '',
      tiktok: dbUser.socials?.tiktok ?? '',
    },
  }

  const notifications = {
    likes: dbUser.notificationSettings?.likes ?? true,
    comments: dbUser.notificationSettings?.comments ?? true,
    follows: dbUser.notificationSettings?.follows ?? true,
    saves: dbUser.notificationSettings?.saves ?? true,
    weeklyDigest: dbUser.notificationSettings?.weeklyDigest ?? false,
  }

  const privacy = {
    profilePublic: dbUser.privacySettings?.profilePublic ?? true,
    showEmail: dbUser.privacySettings?.showEmail ?? false,
    allowMessages: dbUser.privacySettings?.allowMessages ?? true,
    allowFollow: dbUser.privacySettings?.allowFollow ?? true,
  }

  const sections = [
    { id: 'profile', label: t('settings.profilePublic') },
    { id: 'account', label: t('settings.account') },
    { id: 'appearance', label: t('settings.appearance') },
    { id: 'notifications', label: t('settings.notifications') },
    { id: 'privacy', label: t('settings.privacy') },
    { id: 'danger', label: t('settings.dangerZone') },
  ]

  return (
    <AppShell>
      <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-10 lg:gap-16 pb-20">
        <aside className="w-full md:w-62.5 shrink-0 md:sticky md:top-24 md:self-start">
          <h2 className="font-sans font-bold text-2xl mb-8 tracking-tight text-(--color-primary)">
            {t('settings.settings')}
          </h2>
          <nav className="flex flex-row md:flex-col gap-4 overflow-x-auto md:overflow-visible pb-4 md:pb-0">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="font-mono text-(--text-label-sm) tracking-widest uppercase whitespace-nowrap pb-2 md:pb-0 md:pl-4 text-on-surface-variant hover:text-(--color-primary) transition-colors"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="grow max-w-3xl flex flex-col gap-16">
          <Section id="profile" title={t('settings.profilePublic')} description={t('settings.sectionDescription')}>
            <AvatarUploader
              initialAvatarUrl={dbUser.avatarUrl ?? ''}
              displayName={dbUser.displayName || dbUser.username || ''}
            />
            <ProfileForm initial={profile} />
          </Section>

          <Section id="account" title={t('settings.account')}>
            <AccountForm
              initialEmail={dbUser.email}
              createdAt={dbUser.createdAt?.toISOString?.() ?? String(dbUser.createdAt)}
              lastLoginAt={
                dbUser.lastLoginAt
                  ? dbUser.lastLoginAt.toISOString?.() ?? String(dbUser.lastLoginAt)
                  : null
              }
              locale={locale}
            />
          </Section>

          <Section id="appearance" title={t('settings.appearance')}>
            <AppearanceForm />
          </Section>

          <Section id="notifications" title={t('settings.notifications')}>
            <NotificationsForm initial={notifications} />
          </Section>

          <Section id="privacy" title={t('settings.privacy')}>
            <PrivacyForm initial={privacy} />
          </Section>

          <Section id="danger" title={t('settings.dangerZone')}>
            <DangerZone />
          </Section>
        </div>
      </div>
    </AppShell>
  )
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="flex flex-col gap-6 scroll-mt-24">
      <header className="space-y-2">
        <h3 className="font-sans font-semibold text-xl text-(--color-primary)">{title}</h3>
        {description && (
          <p className="text-on-surface-variant font-sans text-sm">{description}</p>
        )}
      </header>
      {children}
    </section>
  )
}
