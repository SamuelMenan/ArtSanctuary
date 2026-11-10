import Link from 'next/link'
import Image from 'next/image'
import { ArrowBox, arrowShellClass } from './ArrowLink'

interface ArtworkCardProps {
  href: string
  imageUrl: string
  title: string
  /** Etiqueta de categoría (chip azul arriba a la izquierda). */
  category?: string
  /** Línea secundaria bajo el título (autor, técnica…). */
  subtitle?: string
  /** Contador de likes (chip blanco abajo a la derecha). Se omite si es undefined. */
  likes?: number
  scroll?: boolean
}

/**
 * Card de obra del diseño: imagen 4:3 con chip de categoría y contador de likes,
 * y debajo la barra "título + autor | flecha". Presentacional puro (un enlace,
 * renderizable en servidor).
 */
export default function ArtworkCard({ href, imageUrl, title, category, subtitle, likes, scroll }: ArtworkCardProps) {
  return (
    <Link href={href} scroll={scroll} className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2">
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-surface-container)]">
        <Image
          src={imageUrl}
          alt={title}
          width={600}
          height={450}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
        {category && (
          <span className="absolute top-2 left-2 px-2 h-[22px] flex items-center bg-[var(--color-brand)] text-[var(--color-on-brand)] font-sans font-semibold text-xs leading-[18px] uppercase">
            {category}
          </span>
        )}
        {likes !== undefined && (
          <span className="absolute bottom-2 right-2 h-7 pl-1.5 pr-2 flex items-center gap-1 bg-[var(--color-on-ink)] text-[var(--color-ink)] font-sans font-semibold text-[13px] leading-[19.5px] tabular-nums">
            <span className="material-symbols-outlined" aria-hidden>favorite</span>
            {likes}
          </span>
        )}
      </div>
      <div className={`${arrowShellClass} !min-h-[62px]`}>
        <span className="flex flex-col justify-center min-w-0 px-4 py-2.5">
          <span className="font-sans font-medium text-base leading-6 uppercase truncate">{title}</span>
          {subtitle && (
            <span className="font-sans font-medium text-[13px] leading-5 text-[var(--color-on-surface-variant)] truncate">
              {subtitle}
            </span>
          )}
        </span>
        <ArrowBox />
      </div>
    </Link>
  )
}
