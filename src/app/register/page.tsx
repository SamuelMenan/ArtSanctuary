import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Crear cuenta | ArtSanctuary',
  description: 'Crea tu cuenta en ArtSanctuary y empieza a compartir tu arte.',
}

export { default } from '@frontend/features/auth/screens/RegisterScreen'
