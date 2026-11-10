import Image from 'next/image'

/**
 * Logos de marca (ArtSanctuary + Corpocarnaval). Presentacional puro.
 * Los archivos viven en `public/brand` y solo existen en tinta oscura; la clase
 * `brand-plate` (globals.css) les pone una placa blanca en tema oscuro para que
 * sigan siendo legibles sin alterar los logos.
 *
 * - `header`: isotipo + wordmark en línea, divisor y Corpocarnaval (56px de barra).
 * - `footer`: isotipo sobre wordmark (apilado), divisor y Corpocarnaval.
 * - `compact`: solo isotipo + wordmark (barra móvil).
 */
const ISOTIPO = { src: '/brand/isotipo-artsanctuary.png', width: 477, height: 512 }
const WORDMARK = { src: '/brand/wordmark-artsanctuary.png', width: 3364, height: 512 }
const CORPOCARNAVAL = { src: '/brand/logo-corpocarnaval.png', width: 1674, height: 512 }

const BRAND = 'ArtSanctuary'
const PARTNER = 'Corpocarnaval'

export default function BrandLogos({ variant = 'header' }: { variant?: 'header' | 'footer' | 'compact' }) {
  if (variant === 'footer') {
    return (
      <div className="brand-plate inline-flex items-end gap-4">
        <span className="flex flex-col items-center gap-3 w-[114px]">
          <Image {...ISOTIPO} alt="" className="h-[66px] w-auto" />
          <Image {...WORDMARK} alt={BRAND} className="w-full h-auto" />
        </span>
        <span className="h-16 w-px bg-[var(--color-outline-variant)]" aria-hidden />
        <Image {...CORPOCARNAVAL} alt={PARTNER} className="h-7 w-auto" />
      </div>
    )
  }

  return (
    <span className="brand-plate inline-flex items-center shrink-0">
      <Image {...ISOTIPO} alt="" priority className="h-10 w-auto" />
      <Image
        {...WORDMARK}
        alt={BRAND}
        priority
        className={`h-5 w-auto ml-3 ${variant === 'header' ? 'hidden lg:block' : ''}`}
      />
      {variant === 'header' && (
        <>
          <span className="hidden xl:block h-8 w-px bg-[var(--color-outline-variant)] mx-3" aria-hidden />
          <Image {...CORPOCARNAVAL} alt={PARTNER} priority className="hidden xl:block h-7 w-auto" />
        </>
      )}
    </span>
  )
}
