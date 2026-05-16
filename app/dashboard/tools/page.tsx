import AppShell from "@/components/layout/AppShell";

export const metadata = {
  title: "Micro-herramientas",
  description:
    "Suite de herramientas de asistencia rápida para artistas: papel milimetrado, cuadrícula, Notan, mezcla de colores y Gesture Drawing.",
};

const TOOLS = [
  {
    id: "graph-paper",
    title: "Papel Milimetrado",
    description:
      "Lienzo de cuadrícula configurable para bocetos proporcionales.",
    icon: "▦",
  },
  {
    id: "grid-overlay",
    title: "Cuadrícula de Referencia",
    description:
      "Superpone una cuadrícula sobre cualquier imagen para encuadrar proporciones.",
    icon: "⊞",
  },
  {
    id: "notan",
    title: "Notan",
    description:
      "Reduce una imagen a valores tonales en blanco, negro y gris medio.",
    icon: "◑",
  },
  {
    id: "color-mixer",
    title: "Mezcla de Colores",
    description: "Simula la mezcla substractiva de pigmentos físicos.",
    icon: "🎨",
  },
  {
    id: "gesture-drawing",
    title: "Gesture Drawing",
    description:
      "Sesiones cronometradas de dibujo de figura con fotos de referencia.",
    icon: "⏱",
  },
];

export default function ToolsPage() {
  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-sanctuary-text mb-2">
          Micro-herramientas
        </h1>
        <p className="font-sans text-sanctuary-muted text-sm">
          Utilidades de asistencia rápida. Todo corre en tu navegador, sin salir
          de ArtSanctuary.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOOLS.map((tool) => (
          <article
            key={tool.id}
            className="group rounded-[var(--radius-card)] bg-sanctuary-surface
                       border border-sanctuary-border p-5
                       hover:border-sanctuary-accent hover:-translate-y-0.5
                       transition-all duration-300 cursor-pointer"
          >
            <div className="size-10 rounded-lg bg-sanctuary-accent/10 flex items-center justify-center mb-4 group-hover:bg-sanctuary-accent/20 transition-colors">
              <span className="text-lg">{tool.icon}</span>
            </div>
            <h3 className="font-serif text-base text-sanctuary-text mb-1">
              {tool.title}
            </h3>
            <p className="font-sans text-xs text-sanctuary-muted leading-relaxed">
              {tool.description}
            </p>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
