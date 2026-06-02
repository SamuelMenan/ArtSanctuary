import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Iniciar sesión | ArtSanctuary',
  description: 'Inicia sesión en tu cuenta de ArtSanctuary.',
}

export { default } from '@frontend/features/auth/screens/LoginScreen'
