import AppShell from "@/components/layout/AppShell";

export const metadata = {
  title: "Explorar",
  description: "Descubre artistas y obras de la comunidad de ArtSanctuary.",
};

export default function ExplorePage() {
  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-sanctuary-text mb-2">
          Explorar
        </h1>
        <p className="font-sans text-sanctuary-muted text-sm">
          Descubre artistas, colecciones y obras de la comunidad.
        </p>
      </div>

      {/* Placeholder */}
      <div className="rounded-[var(--radius-card)] border border-sanctuary-border bg-sanctuary-surface p-12 text-center">
        <span className="text-3xl mb-3 block">◉</span>
        <p className="font-sans text-sanctuary-muted text-sm">
          Esta sección se activará cuando se conecte la base de datos.
        </p>
      </div>
    </AppShell>
  );
}
