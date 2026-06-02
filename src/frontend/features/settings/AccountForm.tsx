import { EmailSection } from './account/EmailSection'
import { PasswordSection } from './account/PasswordSection'
import { SessionsSection } from './account/SessionsSection'
import { AccountInfoSection } from './account/AccountInfoSection'

interface Props {
  initialEmail: string
  createdAt: string
  lastLoginAt: string | null
  locale: string
}

export function AccountForm({ initialEmail, createdAt, lastLoginAt, locale }: Props) {
  return (
    <div className="space-y-12">
      {/* Email */}
      <EmailSection initialEmail={initialEmail} />

      <hr className="border-[var(--color-outline-variant)] opacity-50" />

      {/* Password */}
      <PasswordSection />

      <hr className="border-[var(--color-outline-variant)] opacity-50" />

      {/* Sessions */}
      <SessionsSection />

      <hr className="border-[var(--color-outline-variant)] opacity-50" />

      {/* Account info */}
      <AccountInfoSection createdAt={createdAt} lastLoginAt={lastLoginAt} locale={locale} />
    </div>
  )
}
