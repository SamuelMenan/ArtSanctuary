import Link from "next/link";
import AppShell from "@frontend/shared/layouts/AppShell";
import { auth } from "@backend/auth";
import { getUserById } from "@backend/services/users.service";
import { getFollowingFeed } from "@backend/services/artworks.service";
import ArtworkGrid from "@frontend/shared/ui/ArtworkGrid";
import ArtworkCard from "@frontend/shared/ui/ArtworkCard";
import ArrowLink, { ArrowBox, arrowLabelClass, arrowShellClass } from "@frontend/shared/ui/ArrowLink";
import { createTranslator, getCategoryLabel } from "@shared/i18n";
import { getDictionary } from '@shared/i18n/dictionaries'
import { getRequestLocale } from "@backend/requestPreferences";
import UploadButton from '@frontend/shared/ui/UploadButton';

type Translate = (key: string, vars?: Record<string, string | number>) => string;

// Margen lateral de las secciones a sangre completa (64px en escritorio).
const margin = "px-6 md:px-10 xl:px-[var(--spacing-page-margin)]";
// Título de sección: condensada, negrita, mayúsculas, azul de marca.
const sectionTitle = "font-sans font-bold uppercase text-[40px] leading-[1] md:text-[56px] md:leading-[54px] text-[var(--color-primary)]";
// Titular de los bloques azules (80px en escritorio).
const blockTitle = "font-sans uppercase text-[44px] leading-[1] md:text-[64px] xl:text-[80px] xl:leading-[78px] text-[var(--color-on-brand)]";

const tools = [
  { title: 'toolsDashboard.boardsTitle', desc: 'toolsDashboard.boardsDesc', icon: 'dashboard', href: '/dashboard/tools/boards' },
  { title: 'toolsDashboard.cropTitle', desc: 'toolsDashboard.cropDesc', icon: 'crop', href: '/dashboard/tools/crop' },
  { title: 'toolsDashboard.cutoutTitle', desc: 'toolsDashboard.cutoutDesc', icon: 'background_replace', href: '/dashboard/tools/cutout' },
  { title: 'toolsDashboard.gridTitle', desc: 'toolsDashboard.gridDesc', icon: 'select_all', href: '/dashboard/tools/grid' },
  { title: 'toolsDashboard.notanTitle', desc: 'toolsDashboard.notanDesc', icon: 'contrast', href: '/dashboard/tools/notan' },
  { title: 'toolsDashboard.mixTitle', desc: 'toolsDashboard.mixDesc', icon: 'palette', href: '/dashboard/tools/color-mixing' },
  { title: 'toolsDashboard.gestureTitle', desc: 'toolsDashboard.gestureDesc', icon: 'schedule', href: '/dashboard/tools/gesture' },
  { title: 'toolsDashboard.canonTitle', desc: 'toolsDashboard.canonDesc', icon: 'accessibility_new', href: '/dashboard/tools/canon' },
];

const categories = [
  { value: 'pintura', icon: 'brush' },
  { value: 'escultura', icon: 'view_in_ar' },
  { value: 'ilustracion', icon: 'ink_pen' },
  { value: 'fotografia', icon: 'photo_camera' },
];

/** Grid TOOLS: 8 cards (4 columnas) — bloque lavanda con icono y descripción + barra con flecha. */
function ToolsGrid({ t }: { t: Translate }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--spacing-grid-gutter)]">
      {tools.map((tool) => (
        <Link key={tool.href} href={tool.href} className="group flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2">
          <span className="flex flex-col flex-1 min-h-[248px] bg-[var(--color-surface-container)] p-4 transition-colors group-hover:bg-[var(--color-surface-container-high)]">
            <span className="flex flex-1 items-center justify-center py-4">
              <span className="material-symbols-outlined text-[88px] text-[var(--color-primary)]" aria-hidden>{tool.icon}</span>
            </span>
            <span className="font-sans text-base leading-6 text-[var(--color-on-surface-variant)]">{t(tool.desc)}</span>
          </span>
          <span className={arrowShellClass}>
            <span className={arrowLabelClass}><span className="truncate">{t(tool.title)}</span></span>
            <ArrowBox />
          </span>
        </Link>
      ))}
    </div>
  );
}

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    return <DashboardHome user={session.user} />;
  }

  return <PublicHome />;
}

async function DashboardHome({ user }: { user: { id: string; name?: string | null } }) {
  const locale = await getRequestLocale();
  const t = createTranslator(getDictionary(locale));
  const dbUser = await getUserById(user.id);
  const followingIds = dbUser?.following || [];
  const feedArtworks = await getFollowingFeed(followingIds);

  return (
    <AppShell fullBleed footer>
      {/* User Welcome Section */}
      <section className={`bg-[var(--color-brand)] text-[var(--color-on-brand)] ${margin} py-14 md:py-20`}>
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
          <div className="min-w-0">
            <p className="font-mono text-label-sm uppercase tracking-[0.1em] mb-4 flex items-center gap-3">
              <span className="w-8 h-px bg-[var(--color-on-brand)] block"></span>
              {t('home.panelLabel')}
            </p>
            <h2 className="font-sans font-bold uppercase text-[36px] md:text-[56px] leading-none text-[var(--color-on-brand)]">
              {t('home.welcomeBack', { name: user.name || 'Artista' })}
            </h2>
          </div>
          {/* Standardized upload button */}
          <UploadButton className="border border-[var(--color-on-brand)]" />
        </div>
      </section>

      {/* Micro-tools Quick Access */}
      <section className={`${margin} py-14`}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <h3 className={sectionTitle}>{t('home.yourTools')}</h3>
          <Link href="/dashboard/tools" className="font-sans font-semibold text-base uppercase text-[var(--color-on-surface)] hover:text-[var(--color-primary)] flex items-center gap-1.5 transition-colors duration-200">
            {t('home.viewAll')} <span className="material-symbols-outlined" aria-hidden>north_east</span>
          </Link>
        </div>
        <ToolsGrid t={t} />
      </section>

      {/* Personalized Feed */}
      <section className={`${margin} py-14 border-t border-[var(--color-outline)]`}>
        <h3 className={`${sectionTitle} mb-8`}>{t('home.feed')}</h3>

        {followingIds.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center py-20 bg-[var(--color-surface-container)]">
            <span className="material-symbols-outlined text-[40px] text-[var(--color-primary)] mb-4">person_add</span>
            <h3 className="font-sans font-semibold text-lg text-[var(--color-primary)] mb-2">{t('home.noFollowingTitle')}</h3>
            <p className="font-sans text-[var(--color-on-surface-variant)] text-center max-w-md mb-6 text-base px-4">
              {t('home.noFollowingBody')}
            </p>
            <ArrowLink href="/explore" className="w-64">{t('home.noFollowingCta')}</ArrowLink>
          </div>
        ) : (
          <ArtworkGrid
            locale={locale}
            artworks={JSON.parse(JSON.stringify(feedArtworks))}
            emptyState={
              <div className="w-full flex flex-col items-center justify-center py-20 bg-[var(--color-surface-container)]">
                <span className="material-symbols-outlined text-[40px] text-[var(--color-primary)] mb-4">landscape</span>
                <p className="font-sans text-[var(--color-on-surface-variant)] text-center max-w-md text-base px-4">
                  {t('home.noNewWorks')}
                </p>
              </div>
            }
          />
        )}
      </section>
    </AppShell>
  );
}

async function PublicHome() {
  const locale = await getRequestLocale();
  const t = createTranslator(getDictionary(locale));

  const demoWorks = [
    { title: t('nav.demoArt1Title'), medium: t('nav.demoArt1Medium'), src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCjH7oqtNvBpYq3AKfusyu6Jnp8Xschezn3BntNlesShwKiqL8q0wJIRf3tB8q17-dKvDs1ebrcTFpGqOoyXGwkPHXIVSVdVwHTf8xMVUV-NhN-s8Fz9CKzvBBym_WBKXi0SjXfQ4jWu_ozl2eURef3Xl13GrfNe81dowpll6C0ku9UOzP0V_pwA1IQVuxd6tYWlrz32NutckpNFM4ZN7KWV4KT4aSBbvy0FiB31pN8e72IjBobjDuqRu6dZE_DNhfp5Ve_3HTFw7nK" },
    { title: t('nav.demoArt2Title'), medium: t('nav.demoArt2Medium'), src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAvvTlQugH5vrVXcIx96Kkig2QXvQL4LbwFY3Aoef4yB90iS7RUeyDJch4o9Xf7OaLRmvcMrHcdlpBhdjccGfF3Xop2CDbG7e7pTsK4vKGqccnEnAJo-eC60XGVYG1V3IXimj5ZAScxPM3lj-YJx_xrIw73g-op1tBr2GZRhm56KidvtDZKQoKw2lH3R8K4UdRsnsrb2C907HNjN1aWDQVyXQi9pG8GWdrHQSg02VzoQ6aeG4p5A5YLP2XUPRUVWAMl8FDlDOc0nY0h" },
    { title: t('nav.demoArt3Title'), medium: t('nav.demoArt3Medium'), src: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-tY5jYNXwqEI2nyQxgsS4meWgaRHgMhW5Cbh81ziZrY1g5gO-HbnnlD5PTFQ1Dn8Ge_qThF7V4PVs-qOOZctIG9EYC7qgbe5h6XExUapjFWAgaV5sjCq06YZhH9AweweujZjctDLZK4fviSZEQWXzWt90NBrbsg20G_SzKwxXMPrQO-hLal3Pwz4Mv5QJLLO2bvrRF54Bfg5KNJkWou5pRJy2ZRZYOrS3XvRInc6Y4aM3YdOVBHRBCqqDdMKeObQ2onTb97pCWRHR" },
    { title: t('nav.demoArt4Title'), medium: t('nav.demoArt4Medium'), src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDMu2XU_3kW7bVdPEYyUe-S9HUSY8FrCAOiTyE7R-99x91n029hw0sJKhtkyZtFgdGvOUiehBBcecFdvneb2k_pklbe3o8QFSyG_MxC21Wmfw0L5plual5wr2GAQaeoi4iNYH2gLtc2zyOFTtpGvSHsjr09zl_6-4Rt93ffkCi09-Nqb21bQIbRMSvlXwbzCviQLs0YxiesmDrtJP41Ex6KITluoX078i8mkcEiFfpomMl9xmCPs8wRuc-xTBsSMXVcLA_eXQEIfuEU" },
  ];

  return (
    <AppShell fullBleed footer>
      {/* Hero: bloque de imagen a sangre completa. El diseño lleva una fotografía;
          mientras no exista el asset queda el fondo azul de marca. */}
      <section className="relative h-[320px] md:h-[480px] xl:h-[640px] bg-[var(--color-brand)] overflow-hidden">
        <ArrowLink href="/gallery" className="absolute bottom-0 right-0 w-full max-w-[420px]">
          {t('home.openGallery')}
        </ArrowLink>
      </section>

      {/* Bloque azul: titular + CTA y lista de micro-herramientas */}
      <section className={`bg-[var(--color-brand)] text-[var(--color-on-brand)] ${margin} py-16 xl:py-[86px] grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,564px)] gap-12 lg:gap-16 items-end`}>
        <div className="min-w-0">
          <h2 className={blockTitle}>
            <span className="block font-extralight">{t('home.heroTitleLead')}</span>
            <span className="block font-bold max-w-[11ch]">{t('home.heroTitleRest')}</span>
          </h2>
          <p className="mt-2.5 max-w-[557px] font-sans font-light text-lg leading-7">
            {t('home.heroDescription')}
          </p>
          <ArrowLink href="/register" className="mt-[27px] w-64">
            {t('home.createAccount')}
          </ArrowLink>
        </div>
        <div className="border-l border-[var(--color-on-brand)] pl-6 font-sans">
          <h3 className="font-bold text-xl leading-[30px]">{t('home.microToolsTitle')}</h3>
          <ul className="mt-2 pl-5 font-light text-lg">
            {tools.map((tool) => (
              <li key={tool.href} className="h-8 flex items-center">{t(tool.title)}</li>
            ))}
          </ul>
          <p className="mt-3 font-bold text-lg leading-[27px]">{t('toolsDashboard.subtitle')}</p>
        </div>
      </section>

      {/* TOOLS */}
      <section className={`${margin} pt-14 pb-16`}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <h3 className={sectionTitle}>{t('home.toolsTitle')}</h3>
          <p className="max-w-[412px] font-sans text-base leading-6 text-[var(--color-on-surface-variant)] md:text-right">
            {t('home.microToolsDesc')}
          </p>
        </div>
        <ToolsGrid t={t} />
      </section>

      {/* BROWSE BY CATEGORY */}
      <section className={`${margin} pt-14 pb-16 border-y border-[var(--color-outline)]`}>
        <h3 className={`${sectionTitle} mb-8`}>{t('home.exploreByCategory')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--spacing-grid-gutter)]">
          {categories.map((cat) => (
            <Link key={cat.value} href={`/gallery?category=${cat.value}`} className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2">
              <span className="flex items-center justify-center aspect-[4/3] bg-[var(--color-brand)] text-[var(--color-on-brand)]">
                <span className="material-symbols-outlined text-[72px] transition-transform duration-300 group-hover:scale-110" aria-hidden>{cat.icon}</span>
              </span>
              <span className={arrowShellClass}>
                <span className={arrowLabelClass}><span className="truncate">{getCategoryLabel(locale, cat.value)}</span></span>
                <ArrowBox />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* RECENT WORKS */}
      <section className={`${margin} pt-14 pb-16 border-b border-[var(--color-outline)]`}>
        <div className="flex items-end justify-between gap-4 mb-8">
          <h3 className={sectionTitle}>{t('home.recentWorks')}</h3>
          <Link href="/gallery" className="shrink-0 font-sans font-semibold text-base leading-6 uppercase text-[var(--color-on-surface)] hover:text-[var(--color-primary)] flex items-center gap-1.5 transition-colors duration-200">
            {t('home.viewAll')} <span className="material-symbols-outlined" aria-hidden>north_east</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--spacing-grid-gutter)]">
          {demoWorks.map((work) => (
            <ArtworkCard key={work.title} href="/gallery" imageUrl={work.src} title={work.title} subtitle={work.medium} />
          ))}
        </div>
      </section>

      {/* WORKSPACE */}
      <section className={`bg-[var(--color-brand)] text-[var(--color-on-brand)] ${margin} py-16 xl:py-[86px] flex flex-col`}>
        <h2 className={`${blockTitle} md:text-right md:self-end`}>
          <span className="block font-extralight max-w-[12ch] md:ml-auto">{t('home.workspaceLead')}</span>
          <span className="block font-bold">{t('nav.workspaces')}</span>
        </h2>
        <div className="mt-8 flex flex-col-reverse md:flex-row md:items-end justify-between gap-8">
          <p className="border-l border-[var(--color-on-brand)] pl-6 font-sans font-light text-lg leading-7">
            {t('workspaces.desc')}
          </p>
          <ArrowLink href="/dashboard/workspaces" className="w-64 shrink-0">
            {t('home.goToWorkspace')}
          </ArrowLink>
        </div>
      </section>
    </AppShell>
  );
}
