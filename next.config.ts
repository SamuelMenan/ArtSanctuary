import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

// Analizador de bundle (Palanca 5): `ANALYZE=true npm run build` abre el reporte.
const bundleAnalyzer = withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  async headers() {
    return [
      {
        source: '/dashboard/tools/crop',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          // `credentialless` mantiene crossOriginIsolated (SharedArrayBuffer → IA
          // multihilo de @imgly/background-removal) pero permite cargar imágenes
          // cross-origin (Blob/picsum) sin que estas envíen Cross-Origin-Resource-Policy.
          // Evita que el COEP, arrastrado por soft-navigation del App Router a otras
          // páginas (galería), bloquee las imágenes con error CORP.
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
        ],
      },
    ];
  },
};

export default bundleAnalyzer(nextConfig);
