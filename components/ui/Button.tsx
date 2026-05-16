import { ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "bg-sanctuary-accent hover:bg-sanctuary-accent-hover text-sanctuary-bg",
  ghost:
    "bg-transparent border border-sanctuary-border hover:border-sanctuary-accent text-sanctuary-text",
  danger:
    "bg-red-900/40 hover:bg-red-900/60 text-red-300 border border-red-800",
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
        focus:outline-none focus-visible:ring-2 focus-visible:ring-sanctuary-accent
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
