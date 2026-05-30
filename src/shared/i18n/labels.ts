import type { Locale } from './index'

export function getCategoryLabel(locale: Locale, category?: string) {
  const normalized = (category || '').toLowerCase()
  const labels = {
    es: {
      pintura: 'Pintura',
      escultura: 'Escultura',
      ilustracion: 'Ilustración',
      fotografia: 'Fotografía',
      otro: 'Otro',
      todas: 'Todas',
    },
    en: {
      pintura: 'Painting',
      escultura: 'Sculpture',
      ilustracion: 'Illustration',
      fotografia: 'Photography',
      otro: 'Other',
      todas: 'All',
    },
  } as const

  return labels[locale][normalized as keyof (typeof labels)['es']] || category || ''
}

export function getVisibilityLabel(locale: Locale, visibility?: string) {
  const normalized = (visibility || '').toLowerCase()
  const labels = {
    es: {
      public: 'Público',
      private: 'Privado',
      unlisted: 'Oculto',
    },
    en: {
      public: 'Public',
      private: 'Private',
      unlisted: 'Unlisted',
    },
  } as const

  return labels[locale][normalized as keyof (typeof labels)['es']] || visibility || ''
}
