import AppShell from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export const metadata = {
  title: "Mi Portfolio",
  description: "Tu portfolio personal en ArtSanctuary.",
};

export default function ProfilePage() {
  return (
    <AppShell>
      {/* Profile header */}
      <div className="flex items-start gap-5 mb-10">
        {/* Avatar placeholder */}
        <div className="shrink-0 size-20 rounded-full bg-sanctuary-surface border-2 border-sanctuary-border flex items-center justify-center">
          <span className="font-serif text-2xl text-sanctuary-accent">A</span>
        </div>
        <div>
          <h1 className="text-2xl font-serif text-sanctuary-text">
            Artista Demo
          </h1>
          <p className="font-mono text-xs text-sanctuary-muted mt-1">
            @artista_demo · Pasto, Nariño
          </p>
          <p className="font-sans text-sm text-sanctuary-muted mt-2 max-w-md">
            Artista plástico enfocado en pintura al óleo y escultura
            contemporánea.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <Badge plan="free" />
            <Button variant="ghost" className="text-xs px-3 py-1">
              Editar perfil
            </Button>
          </div>
        </div>
      </div>

      {/* Portfolio grid placeholder */}
      <h2 className="text-xl font-serif text-sanctuary-text mb-4">Obras</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {["obra-1", "obra-2", "obra-3", "obra-4"].map((id, i) => (
          <div
            key={id}
            className="aspect-square rounded-[var(--radius-card)]
                       bg-sanctuary-surface border border-sanctuary-border
                       flex items-center justify-center"
          >
            <span className="font-mono text-xs text-sanctuary-muted">
              Obra {i + 1}
            </span>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
