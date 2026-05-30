import { ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] shadow-[0_1px_0_var(--color-outline)] hover:bg-[var(--color-primary-container)]",
  ghost:
    "bg-transparent border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] text-[var(--color-on-surface)]",
  danger:
    "bg-[var(--color-error-container)] hover:opacity-90 text-[var(--color-on-error-container)] border border-[var(--color-error)]",
} as const;

type Variant = keyof typeof variants;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        px-4 py-2 rounded-lg font-sans text-sm font-medium
        transition-colors duration-200 cursor-pointer
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-outline)]
        disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-[var(--color-surface-container-high)] disabled:text-[var(--color-on-surface-variant)] disabled:border-[var(--color-outline-variant)] disabled:shadow-none
        ${variants[variant]} ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
