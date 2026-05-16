"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { label: "Galería", href: "/gallery", icon: "◫" },
  { label: "Explorar", href: "/explore", icon: "◉" },
  { label: "Herramientas", href: "/dashboard/tools", icon: "⬡" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-sanctuary-border">
      <nav className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-xl font-serif tracking-tight text-sanctuary-accent transition-colors duration-200 group-hover:text-sanctuary-accent-hover">
            Art
          </span>
          <span className="text-xl font-serif tracking-tight text-sanctuary-text">
            Sanctuary
          </span>
        </Link>

        {/* Nav links — desktop */}
        <ul className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                           text-sm font-sans text-sanctuary-muted
                           hover:text-sanctuary-text hover:bg-sanctuary-surface
                           transition-colors duration-200"
              >
                <span className="text-xs opacity-60">{link.icon}</span>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-lg text-sm font-sans
                       text-sanctuary-muted hover:text-sanctuary-text
                       transition-colors duration-200"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="px-4 py-1.5 rounded-lg text-sm font-sans font-medium
                       bg-sanctuary-accent text-sanctuary-bg
                       hover:bg-sanctuary-accent-hover
                       transition-colors duration-200"
          >
            Crear cuenta
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-lg text-sanctuary-muted
                     hover:text-sanctuary-text hover:bg-sanctuary-surface
                     transition-colors duration-200"
          aria-label="Abrir menú"
        >
          <span className="text-lg">{menuOpen ? "✕" : "☰"}</span>
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-sanctuary-border bg-sanctuary-surface/95 backdrop-blur-lg">
          <ul className="flex flex-col px-6 py-4 gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg
                             text-sm text-sanctuary-muted
                             hover:text-sanctuary-text hover:bg-sanctuary-bg
                             transition-colors duration-200"
                >
                  <span className="text-xs opacity-60">{link.icon}</span>
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="border-t border-sanctuary-border mt-2 pt-2">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 text-sm text-sanctuary-muted
                           hover:text-sanctuary-text transition-colors"
              >
                Iniciar sesión
              </Link>
            </li>
            <li>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium
                           text-sanctuary-accent hover:text-sanctuary-accent-hover
                           transition-colors"
              >
                Crear cuenta
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
