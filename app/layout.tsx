import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/* ── Fuentes ── */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

/* ── SEO ── */
export const metadata: Metadata = {
  title: {
    default: "ArtSanctuary — Tu santuario creativo",
    template: "%s | ArtSanctuary",
  },
  description:
    "Plataforma digital para artistas, escultores e ilustradores de Pasto, Nariño. Biblioteca de referencias visuales y herramientas colaborativas sin distracciones.",
  keywords: [
    "arte",
    "artistas",
    "escultura",
    "ilustración",
    "referencias visuales",
    "Pasto",
    "Nariño",
    "portfolio",
  ],
};

/* ── Root Layout ── */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${playfair.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-sanctuary-bg text-sanctuary-text">
        {children}
      </body>
    </html>
  );
}
