const styles: Record<string, string> = {
  free: "bg-sanctuary-surface text-sanctuary-muted border border-sanctuary-border",
  pro: "bg-sanctuary-accent/15 text-sanctuary-accent border border-sanctuary-accent/40",
};

const labels: Record<string, string> = {
  free: "Observador",
  pro: "✦ Alma Creativa",
};

interface BadgeProps {
  plan?: "free" | "pro";
}

export default function Badge({ plan = "free" }: BadgeProps) {
  return (
    <span
      className={`
        inline-block px-2.5 py-0.5 rounded-full
        font-mono text-xs tracking-wide
        ${styles[plan]}
      `}
    >
      {labels[plan]}
    </span>
  );
}
