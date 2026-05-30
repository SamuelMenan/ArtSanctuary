import Link from "next/link";
import Image from "next/image";
import AppShell from "@/components/layout/AppShell";
import { auth } from "@/auth";
import { connectDB } from "@backend/db/mongoose";
import User from "@backend/models/User";
import Artwork from "@backend/models/Artwork";
import ArtworkGrid from "@/components/ui/ArtworkGrid";
import { createTranslator, getCategoryLabel, getDictionary } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/requestPreferences";
import UploadButton from '@/components/ui/UploadButton';

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    return <DashboardHome user={session.user} />;
  }

  return <PublicHome />;
}

async function DashboardHome({ user }: { user: any }) {
  const locale = await getRequestLocale();
  const t = createTranslator(getDictionary(locale));
  await connectDB();
  const dbUser = await User.findById(user.id).lean();
  const followingIds = dbUser?.following || [];

  const feedArtworks = followingIds.length > 0 
    ? await Artwork.find({ artistId: { $in: followingIds }, visibility: 'public' })
        .sort({ uploadDate: -1 })
        .limit(20)
        .populate('artistId', 'username displayName avatarUrl')
        .lean()
    : [];

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto w-full space-y-12 lg:space-y-16 pb-20">
        
        {/* User Welcome Section */}
        <section className="border border-[var(--color-outline-variant)] p-8 relative overflow-hidden flex flex-col justify-center min-h-[200px] bg-[var(--color-surface-container-lowest)] rounded-lg">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <p className="font-mono text-[var(--text-label-sm)] uppercase tracking-[0.1em] text-[var(--color-on-surface-variant)] mb-2 flex items-center gap-3">
                <span className="w-8 h-[1px] bg-[var(--color-outline-variant)] block"></span>
                {t('home.panelLabel')}
              </p>
              <h2 className="font-sans text-3xl md:text-4xl font-semibold text-[var(--color-primary)] tracking-tight">
                {t('home.welcomeBack', { name: user.name || 'Artista' })}
              </h2>
            </div>
            <div className="flex gap-4">
              {/* Standardized upload button */}
              <UploadButton />
            </div>
          </div>
        </section>

        {/* Micro-tools Quick Access */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-sans text-xl font-semibold text-[var(--color-primary)]">{t('home.yourTools')}</h3>
            <Link href="/dashboard/tools" className="font-mono text-[var(--text-label-sm)] uppercase tracking-widest text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] flex items-center gap-2 transition-colors duration-200">
              {t('home.viewAll')} <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Link href="/dashboard/boards" className="border border-[var(--color-outline-variant)] p-4 bg-[var(--color-surface-container-lowest)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-container)] transition-all duration-200 rounded-lg flex flex-col items-center gap-3 text-center">
              <span className="material-symbols-outlined text-2xl text-[var(--color-primary)]">dashboard</span>
              <span className="font-sans text-sm text-[var(--color-on-surface)]">{t('home.tools.boards')}</span>
            </Link>
            <Link href="/dashboard/tools/notan" className="border border-[var(--color-outline-variant)] p-4 bg-[var(--color-surface-container-lowest)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-container)] transition-all duration-200 rounded-lg flex flex-col items-center gap-3 text-center">
              <span className="material-symbols-outlined text-2xl text-[var(--color-primary)]">contrast</span>
              <span className="font-sans text-sm text-[var(--color-on-surface)]">{t('home.tools.notan')}</span>
            </Link>
            <Link href="/dashboard/tools/mezcla" className="border border-[var(--color-outline-variant)] p-4 bg-[var(--color-surface-container-lowest)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-container)] transition-all duration-200 rounded-lg flex flex-col items-center gap-3 text-center">
              <span className="material-symbols-outlined text-2xl text-[var(--color-primary)]">palette</span>
              <span className="font-sans text-sm text-[var(--color-on-surface)]">{t('home.tools.mix')}</span>
            </Link>
            <Link href="/dashboard/tools/gesture" className="border border-[var(--color-outline-variant)] p-4 bg-[var(--color-surface-container-lowest)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-container)] transition-all duration-200 rounded-lg flex flex-col items-center gap-3 text-center">
              <span className="material-symbols-outlined text-2xl text-[var(--color-primary)]">timer</span>
              <span className="font-sans text-sm text-[var(--color-on-surface)]">{t('home.tools.gesture')}</span>
            </Link>
            <Link href="/dashboard/tools/canon" className="border border-[var(--color-outline-variant)] p-4 bg-[var(--color-surface-container-lowest)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-container)] transition-all duration-200 rounded-lg flex flex-col items-center gap-3 text-center">
              <span className="material-symbols-outlined text-2xl text-[var(--color-primary)]">straighten</span>
              <span className="font-sans text-sm text-[var(--color-on-surface)]">{t('home.tools.canon')}</span>
            </Link>
          </div>
        </section>

        {/* Personalized Feed (Masonry) */}
        <section>
          <div className="flex items-end justify-between mb-8 border-b border-[var(--color-outline-variant)] pb-4">
            <h3 className="font-sans text-2xl font-semibold text-[var(--color-primary)]">{t('home.feed')}</h3>
          </div>
          
          {followingIds.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center py-20 bg-[var(--color-surface-container-lowest)] border border-dashed border-[var(--color-outline-variant)] rounded-sm">
              <span className="material-symbols-outlined text-4xl text-[var(--color-on-surface-variant)] mb-4 opacity-50">person_add</span>
              <h3 className="font-sans font-semibold text-lg text-[var(--color-primary)] mb-2">{t('home.noFollowingTitle')}</h3>
              <p className="font-sans text-[var(--color-on-surface-variant)] text-center max-w-md mb-6 text-sm">
                {t('home.noFollowingBody')}
              </p>
              <Link href="/explore" className="bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] shadow-[0_1px_0_var(--color-outline)] font-mono text-xs uppercase tracking-widest px-6 py-3 hover:bg-[var(--color-primary-container)] transition-colors rounded-sm">
                {t('home.noFollowingCta')}
              </Link>
            </div>
          ) : (
            <ArtworkGrid 
              artworks={JSON.parse(JSON.stringify(feedArtworks))}
              emptyState={
                <div className="w-full flex flex-col items-center justify-center py-20 bg-[var(--color-surface-container-lowest)] border border-dashed border-[var(--color-outline-variant)] rounded-sm">
                  <span className="material-symbols-outlined text-4xl text-[var(--color-on-surface-variant)] mb-4 opacity-50">landscape</span>
                  <p className="font-sans text-[var(--color-on-surface-variant)] text-center max-w-md text-sm">
                    {t('home.noNewWorks')}
                  </p>
                </div>
              }
            />
          )}
        </section>
      </div>
    </AppShell>
  );
}

async function PublicHome() {
  const locale = await getRequestLocale();
  const t = createTranslator(getDictionary(locale));

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto w-full space-y-16 lg:space-y-24 pb-20">
        
        {/* Hero Section */}
        <section className="border border-[var(--color-outline-variant)] p-8 md:p-16 lg:p-20 relative overflow-hidden flex flex-col justify-center min-h-[512px] bg-[var(--color-surface-container-lowest)] rounded-lg">
          {/* Subtle noise overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>
          
          <div className="relative z-10 max-w-3xl">
            <p className="font-mono text-[var(--text-label-sm)] uppercase tracking-[0.1em] text-[var(--color-on-surface-variant)] mb-6 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-[var(--color-outline-variant)] block"></span>
              {t('home.heroLabel')}
            </p>
            <h2 className="font-sans text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--color-primary)] leading-[1.1] tracking-tight mb-8">
              {t('home.heroTitle')}
            </h2>
            <p className="font-sans text-[var(--text-body-md)] text-[var(--color-on-surface-variant)] md:text-lg mb-12 max-w-2xl leading-relaxed">
              {t('home.heroDescription')}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/gallery" className="bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] shadow-[0_1px_0_var(--color-outline)] font-mono text-xs uppercase tracking-widest px-8 py-4 rounded-sm hover:bg-[var(--color-primary-container)] transition-colors duration-200 inline-block text-center">
                {t('home.openGallery')}
              </Link>
              <Link href="/register" className="bg-transparent border border-[var(--color-outline-variant)] text-[var(--color-primary)] font-mono text-[var(--text-label-sm)] uppercase tracking-widest px-8 py-4 rounded-sm hover:bg-[var(--color-surface-container)] transition-colors duration-200 inline-block text-center">
                {t('home.createAccount')}
              </Link>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-sans text-2xl font-semibold text-[var(--color-primary)]">{t('home.exploreByCategory')}</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Link href="#" className="group border border-[var(--color-outline-variant)] p-6 flex flex-col items-center justify-center gap-4 bg-[var(--color-surface-container-lowest)] hover:border-[var(--color-primary)] transition-colors duration-300 relative overflow-hidden rounded-lg">
              <div className="absolute inset-0 bg-[var(--color-surface-container)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="material-symbols-outlined text-4xl text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)] transition-colors duration-300 relative z-10" style={{ fontVariationSettings: "'FILL' 0" }}>brush</span>
              <div className="text-center relative z-10">
                <h4 className="font-sans text-lg font-semibold text-[var(--color-primary)] mb-1">{getCategoryLabel(locale, 'pintura')}</h4>
                <p className="font-mono text-[10px] text-[var(--color-on-surface-variant)] tracking-widest uppercase">128 {t('home.categoryCountsSuffix')}</p>
              </div>
            </Link>
            <Link href="#" className="group border border-[var(--color-outline-variant)] p-6 flex flex-col items-center justify-center gap-4 bg-[var(--color-surface-container-lowest)] hover:border-[var(--color-primary)] transition-colors duration-300 relative overflow-hidden rounded-lg">
              <div className="absolute inset-0 bg-[var(--color-surface-container)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="text-4xl grayscale group-hover:grayscale-0 transition-all duration-300 relative z-10">🗿</span>
              <div className="text-center relative z-10">
                <h4 className="font-sans text-lg font-semibold text-[var(--color-primary)] mb-1">{getCategoryLabel(locale, 'escultura')}</h4>
                <p className="font-mono text-[10px] text-[var(--color-on-surface-variant)] tracking-widest uppercase">64 {t('home.categoryCountsSuffix')}</p>
              </div>
            </Link>
            <Link href="#" className="group border border-[var(--color-outline-variant)] p-6 flex flex-col items-center justify-center gap-4 bg-[var(--color-surface-container-lowest)] hover:border-[var(--color-primary)] transition-colors duration-300 relative overflow-hidden rounded-lg">
              <div className="absolute inset-0 bg-[var(--color-surface-container)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="material-symbols-outlined text-4xl text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)] transition-colors duration-300 relative z-10" style={{ fontVariationSettings: "'FILL' 0" }}>ink_pen</span>
              <div className="text-center relative z-10">
                <h4 className="font-sans text-lg font-semibold text-[var(--color-primary)] mb-1">{getCategoryLabel(locale, 'ilustracion')}</h4>
                <p className="font-mono text-[10px] text-[var(--color-on-surface-variant)] tracking-widest uppercase">96 {t('home.categoryCountsSuffix')}</p>
              </div>
            </Link>
            <Link href="#" className="group border border-[var(--color-outline-variant)] p-6 flex flex-col items-center justify-center gap-4 bg-[var(--color-surface-container-lowest)] hover:border-[var(--color-primary)] transition-colors duration-300 relative overflow-hidden rounded-lg">
              <div className="absolute inset-0 bg-[var(--color-surface-container)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="material-symbols-outlined text-4xl text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)] transition-colors duration-300 relative z-10" style={{ fontVariationSettings: "'FILL' 0" }}>photo_camera</span>
              <div className="text-center relative z-10">
                <h4 className="font-sans text-lg font-semibold text-[var(--color-primary)] mb-1">{getCategoryLabel(locale, 'fotografia')}</h4>
                <p className="font-mono text-[10px] text-[var(--color-on-surface-variant)] tracking-widest uppercase">52 {t('home.categoryCountsSuffix')}</p>
              </div>
            </Link>
          </div>
        </section>

        {/* Recent Works Masonry */}
        <section>
          <div className="flex items-end justify-between mb-8 border-b border-[var(--color-outline-variant)] pb-4">
            <h3 className="font-sans text-2xl font-semibold text-[var(--color-primary)]">{t('home.recentWorks')}</h3>
            <Link href="/gallery" className="font-mono text-[var(--text-label-sm)] uppercase tracking-widest text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] flex items-center gap-2 transition-colors duration-200">
              {t('home.viewAll')} <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
          <div className="masonry-grid">
            {/* Item 1 (Portrait) */}
            <div className="masonry-item relative group rounded-md overflow-hidden border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] aspect-[3/4]">
              <Image 
                alt="Ecos del Silencio" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjH7oqtNvBpYq3AKfusyu6Jnp8Xschezn3BntNlesShwKiqL8q0wJIRf3tB8q17-dKvDs1ebrcTFpGqOoyXGwkPHXIVSVdVwHTf8xMVUV-NhN-s8Fz9CKzvBBym_WBKXi0SjXfQ4jWu_ozl2eURef3Xl13GrfNe81dowpll6C0ku9UOzP0V_pwA1IQVuxd6tYWlrz32NutckpNFM4ZN7KWV4KT4aSBbvy0FiB31pN8e72IjBobjDuqRu6dZE_DNhfp5Ve_3HTFw7nK"
                width={300}
                height={400}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <h4 className="font-sans text-lg font-semibold text-[var(--color-primary)]">Ecos del Silencio</h4>
                <p className="font-mono text-[10px] text-[var(--color-on-surface-variant)] mt-1 uppercase tracking-widest">Óleo sobre lienzo</p>
              </div>
            </div>
            
            {/* Item 2 (Square) */}
            <div className="masonry-item relative group rounded-md overflow-hidden border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] aspect-square">
              <Image 
                alt="Forma Pura" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvvTlQugH5vrVXcIx96Kkig2QXvQL4LbwFY3Aoef4yB90iS7RUeyDJch4o9Xf7OaLRmvcMrHcdlpBhdjccGfF3Xop2CDbG7e7pTsK4vKGqccnEnAJo-eC60XGVYG1V3IXimj5ZAScxPM3lj-YJx_xrIw73g-op1tBr2GZRhm56KidvtDZKQoKw2lH3R8K4UdRsnsrb2C907HNjN1aWDQVyXQi9pG8GWdrHQSg02VzoQ6aeG4p5A5YLP2XUPRUVWAMl8FDlDOc0nY0h"
                width={300}
                height={300}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <h4 className="font-sans text-lg font-semibold text-[var(--color-primary)]">Forma 04</h4>
                <p className="font-mono text-[10px] text-[var(--color-on-surface-variant)] mt-1 uppercase tracking-widest">Escultura</p>
              </div>
            </div>
            
            {/* Item 3 (Landscape) */}
            <div className="masonry-item relative group rounded-md overflow-hidden border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] aspect-[4/3]">
              <Image 
                alt="Líneas de Tensión" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-tY5jYNXwqEI2nyQxgsS4meWgaRHgMhW5Cbh81ziZrY1g5gO-HbnnlD5PTFQ1Dn8Ge_qThF7V4PVs-qOOZctIG9EYC7qgbe5h6XExUapjFWAgaV5sjCq06YZhH9AweweujZjctDLZK4fviSZEQWXzWt90NBrbsg20G_SzKwxXMPrQO-hLal3Pwz4Mv5QJLLO2bvrRF54Bfg5KNJkWou5pRJy2ZRZYOrS3XvRInc6Y4aM3YdOVBHRBCqqDdMKeObQ2onTb97pCWRHR"
                width={400}
                height={300}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <h4 className="font-sans text-lg font-semibold text-[var(--color-primary)]">Líneas de Tensión</h4>
                <p className="font-mono text-[10px] text-[var(--color-on-surface-variant)] mt-1 uppercase tracking-widest">Tinta china</p>
              </div>
            </div>
            
            {/* Item 4 (Portrait) */}
            <div className="masonry-item relative group rounded-md overflow-hidden border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] aspect-[3/5]">
              <Image 
                alt="Estudio de Textura II" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMu2XU_3kW7bVdPEYyUe-S9HUSY8FrCAOiTyE7R-99x91n029hw0sJKhtkyZtFgdGvOUiehBBcecFdvneb2k_pklbe3o8QFSyG_MxC21Wmfw0L5plual5wr2GAQaeoi4iNYH2gLtc2zyOFTtpGvSHsjr09zl_6-4Rt93ffkCi09-Nqb21bQIbRMSvlXwbzCviQLs0YxiesmDrtJP41Ex6KITluoX078i8mkcEiFfpomMl9xmCPs8wRuc-xTBsSMXVcLA_eXQEIfuEU"
                width={300}
                height={500}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <h4 className="font-sans text-lg font-semibold text-[var(--color-primary)]">Estudio de Textura II</h4>
                <p className="font-mono text-[10px] text-[var(--color-on-surface-variant)] mt-1 uppercase tracking-widest">Ilustración</p>
              </div>
            </div>
          </div>
        </section>

        {/* Micro-tools Block */}
        <section className="border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 rounded-lg">
          <div className="flex items-start gap-6 max-w-2xl">
            <div className="size-12 flex-shrink-0 border border-[var(--color-outline-variant)] flex items-center justify-center rounded-sm bg-[var(--color-surface)]">
              <span className="material-symbols-outlined text-[var(--color-primary)]">architecture</span>
            </div>
            <div>
              <h3 className="font-sans font-semibold text-xl text-[var(--color-primary)] mb-2">
                {locale === 'en' ? 'Assisted micro-tools' : 'Micro-herramientas de Asistencia'}
              </h3>
              <p className="font-sans text-[var(--color-on-surface-variant)] leading-relaxed">
                {locale === 'en'
                  ? 'Boards, reference grids, Notan, color mixing, and Gesture Drawing: everything in your browser, without leaving ArtSanctuary.'
                  : 'Boards, cuadrícula de referencia, Notan, mezcla de colores y Gesture Drawing: todo en tu navegador, sin salir de ArtSanctuary.'}
              </p>
            </div>
          </div>
          <Link href="/dashboard/tools" className="bg-transparent border border-[var(--color-outline-variant)] text-[var(--color-primary)] font-mono text-[var(--text-label-sm)] uppercase tracking-widest px-8 py-3 rounded-sm hover:bg-[var(--color-surface-container)] transition-colors duration-200 whitespace-nowrap flex-shrink-0 flex items-center gap-2">
            {locale === 'en' ? 'Explore' : 'Explorar'} <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </section>
        
      </div>
    </AppShell>
  );
}
