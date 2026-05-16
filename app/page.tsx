import Link from "next/link";
import AppShell from "@/components/layout/AppShell";

/* ── Datos de ejemplo — mock estático, sin base de datos ── */
const FEATURED_CATEGORIES = [
  { label: "Pintura", icon: "🎨", count: 128 },
  { label: "Escultura", icon: "🗿", count: 64 },
  { label: "Ilustración", icon: "✏️", count: 96 },
  { label: "Fotografía", icon: "📷", count: 52 },
];

const PLACEHOLDER_WORKS = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  title: `Obra ${i + 1}`,
  category: FEATURED_CATEGORIES[i % 4].label,
  author: `artista_${i + 1}`,
  hue: (i * 45) % 360,
}));

export default function HomePage() {
  return (
    <AppShell>
      {/* ── Hero Section ── */}
      <section className="mb-14">
        <div className="relative rounded-[var(--radius-card)] overflow-hidden bg-sanctuary-surface border border-sanctuary-border p-8 sm:p-12">
          {/* Decorative gradient */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 30% 50%, rgba(201,169,110,0.3) 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10 max-w-2xl">
            <p className="font-mono text-xs text-sanctuary-accent tracking-widest uppercase mb-4">
              Bienvenido a tu santuario creativo
            </p>
            <h1 className="text-4xl sm:text-5xl font-serif text-sanctuary-text leading-tight mb-4">
              Donde el{" "}
              <span className="text-gradient-gold">arte</span>{" "}
              vive sin distracciones
            </h1>
            <p className="font-sans text-sanctuary-muted text-base sm:text-lg leading-relaxed mb-8">
              Biblioteca de referencias visuales curada, portfolio limpio y
              herramientas colaborativas para la comunidad artística de Pasto,
              Nariño.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/gallery"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
                           text-sm font-sans font-medium
                           bg-sanctuary-accent text-sanctuary-bg
                           hover:bg-sanctuary-accent-hover
                           transition-colors duration-200"
              >
                Explorar galería
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
                           text-sm font-sans font-medium
                           bg-transparent border border-sanctuary-border text-sanctuary-text
                           hover:border-sanctuary-accent
                           transition-colors duration-200"
              >
                Crear cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categorías ── */}
      <section className="mb-14">
        <h2 className="text-2xl font-serif text-sanctuary-text mb-6">
          Explorar por categoría
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FEATURED_CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href={`/gallery?category=${cat.label.toLowerCase()}`}
              className="group flex flex-col items-center gap-2 p-5
                         rounded-[var(--radius-card)]
                         bg-sanctuary-surface border border-sanctuary-border
                         hover:border-sanctuary-accent hover:-translate-y-0.5
                         transition-all duration-300"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="font-sans text-sm text-sanctuary-text group-hover:text-sanctuary-accent transition-colors">
                {cat.label}
              </span>
              <span className="font-mono text-[10px] text-sanctuary-muted">
                {cat.count} obras
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Obras recientes (placeholders con color generativo) ── */}
      <section className="mb-14">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl font-serif text-sanctuary-text">
            Obras recientes
          </h2>
          <Link
            href="/gallery"
            className="text-xs font-mono text-sanctuary-muted hover:text-sanctuary-accent transition-colors"
          >
            Ver todas →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {PLACEHOLDER_WORKS.map((work) => (
            <article
              key={work.id}
              className="group relative rounded-[var(--radius-card)] overflow-hidden
                         bg-sanctuary-surface border border-sanctuary-border
                         transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              {/* Imagen placeholder — gradiente generativo */}
              <div
                className="aspect-square w-full"
                style={{
                  background: `linear-gradient(135deg,
                    hsl(${work.hue}, 30%, 18%) 0%,
                    hsl(${work.hue + 30}, 25%, 12%) 100%)`,
                }}
              >
                <div className="size-full flex items-center justify-center">
                  <span className="font-serif text-3xl text-white/10">
                    {work.id}
                  </span>
                </div>
              </div>

              {/* Metadatos — hover reveal */}
              <div
                className="absolute bottom-0 left-0 right-0
                           bg-gradient-to-t from-black/70 to-transparent
                           p-4 translate-y-full group-hover:translate-y-0
                           transition-transform duration-300"
              >
                <p className="font-serif text-white text-sm truncate">
                  {work.title}
                </p>
                <p className="font-mono text-sanctuary-muted text-xs mt-1">
                  {work.category} · @{work.author}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Micro-herramientas teaser ── */}
      <section className="mb-10">
        <div
          className="rounded-[var(--radius-card)] border border-sanctuary-border
                     bg-sanctuary-surface p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6"
        >
          <div className="shrink-0 size-12 rounded-lg bg-sanctuary-accent/15 flex items-center justify-center">
            <span className="text-xl text-sanctuary-accent">⬡</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-serif text-sanctuary-text mb-1">
              Micro-herramientas de Asistencia
            </h3>
            <p className="font-sans text-sm text-sanctuary-muted leading-relaxed">
              Papel milimetrado, cuadrícula de referencia, Notan, mezcla de
              colores y Gesture Drawing: todo en tu navegador, sin salir de
              ArtSanctuary.
            </p>
          </div>
          <Link
            href="/dashboard/tools"
            className="shrink-0 px-4 py-2 rounded-lg text-sm font-sans font-medium
                       border border-sanctuary-border text-sanctuary-text
                       hover:border-sanctuary-accent transition-colors duration-200"
          >
            Explorar →
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
