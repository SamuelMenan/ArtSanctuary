import AppShell from "@/components/layout/AppShell";

export const metadata = {
  title: "Galería",
  description: "Explora la biblioteca de referencias visuales curada de ArtSanctuary.",
};

const GALLERY_ITEMS = Array.from({ length: 12 }, (_, i) => ({
  id: `ref-${i + 1}`,
  label: `Referencia ${i + 1}`,
}));

export default function GalleryPage() {
  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-sanctuary-text mb-2">
          Biblioteca de Referencias
        </h1>
        <p className="font-sans text-sanctuary-muted text-sm">
          Explora, filtra y guarda referencias visuales para tu proceso creativo.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-8">
        {["Todas", "Pintura", "Escultura", "Ilustración", "Fotografía"].map(
          (filter) => (
            <button
              key={filter}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono
                transition-colors duration-200 cursor-pointer
                ${
                  filter === "Todas"
                    ? "bg-sanctuary-accent text-sanctuary-bg"
                    : "bg-sanctuary-surface border border-sanctuary-border text-sanctuary-muted hover:text-sanctuary-text hover:border-sanctuary-accent"
                }`}
            >
              {filter}
            </button>
          )
        )}
      </div>

      {/* Grid placeholder */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {GALLERY_ITEMS.map((item) => (
          <div
            key={item.id}
            className="aspect-square rounded-[var(--radius-card)]
                       bg-sanctuary-surface border border-sanctuary-border
                       flex items-center justify-center"
          >
            <span className="font-mono text-xs text-sanctuary-muted">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
