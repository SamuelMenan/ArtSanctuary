"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SIDEBAR_LINKS = [
  { label: "Inicio", href: "/", icon: "◈" },
  { label: "Galería", href: "/gallery", icon: "◫" },
  { label: "Explorar", href: "/explore", icon: "◉" },
  { label: "Herramientas", href: "/dashboard/tools", icon: "⬡" },
  { label: "Mi Portfolio", href: "/profile", icon: "◧" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden lg:flex flex-col w-56 shrink-0 h-screen sticky top-0
                 bg-sanctuary-surface border-r border-sanctuary-border"
    >
      {/* Logo */}
      <div className="px-5 h-14 flex items-center border-b border-sanctuary-border">
        <Link href="/" className="group flex items-center gap-2">
          <span className="text-lg font-serif text-sanctuary-accent group-hover:text-sanctuary-accent-hover transition-colors">
            Art
          </span>
          <span className="text-lg font-serif text-sanctuary-text">
            Sanctuary
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="flex flex-col gap-0.5">
          {SIDEBAR_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`
                    flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-sans
                    transition-colors duration-200
                    ${
                      isActive
                        ? "bg-sanctuary-accent-dim text-sanctuary-accent font-medium"
                        : "text-sanctuary-muted hover:text-sanctuary-text hover:bg-sanctuary-bg"
                    }
                  `}
                >
                  <span className={`text-xs ${isActive ? "opacity-100" : "opacity-50"}`}>
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer: plan badge */}
      <div className="p-4 border-t border-sanctuary-border">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg
                     bg-sanctuary-bg border border-sanctuary-border"
        >
          <div className="size-7 rounded-full bg-sanctuary-accent/20 flex items-center justify-center">
            <span className="text-xs text-sanctuary-accent">✦</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-sans text-sanctuary-text leading-tight">
              Plan Free
            </span>
            <span className="text-[10px] font-mono text-sanctuary-muted leading-tight">
              Observador
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
