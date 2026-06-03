'use client'

import { useState } from 'react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { FollowListModal, type FollowKind } from './FollowListModal'

interface Props {
  userId: string
  followersCount: number
  followingCount: number
  layout?: 'inline' | 'cells'
  followersLabel?: string
  followingLabel?: string
}

export function FollowStats({
  userId,
  followersCount,
  followingCount,
  layout = 'inline',
  followersLabel,
  followingLabel,
}: Props) {
  const { t } = usePreferences()
  const [open, setOpen] = useState<FollowKind | null>(null)

  const fLabel = followersLabel ?? t('profile.followers')
  const gLabel = followingLabel ?? t('profile.following')

  if (layout === 'cells') {
    return (
      <>
        <MetricBtn value={followersCount} label={fLabel} onClick={() => setOpen('followers')} />
        <MetricBtn value={followingCount} label={gLabel} onClick={() => setOpen('following')} />
        <Modals userId={userId} open={open} setOpen={setOpen} t={t} />
      </>
    )
  }

  const inlineCls =
    'group flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-sm px-1'

  return (
    <>
      <div className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)]">
        <button type="button" onClick={() => setOpen('followers')} className={inlineCls}>
          <strong className="text-[var(--color-primary)] text-xs">{followersCount}</strong>
          <span>{fLabel}</span>
        </button>
        <button type="button" onClick={() => setOpen('following')} className={inlineCls}>
          <strong className="text-[var(--color-primary)] text-xs">{followingCount}</strong>
          <span>{gLabel}</span>
        </button>
      </div>
      <Modals userId={userId} open={open} setOpen={setOpen} t={t} />
    </>
  )
}

function MetricBtn({
  value,
  label,
  onClick,
}: {
  value: number
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-[var(--color-surface-container-lowest)] p-3 flex flex-col gap-0.5 justify-center transition-colors hover:bg-[var(--color-surface-container-low)] focus:outline-none focus-visible:bg-[var(--color-surface-container)] group"
    >
      <span className="font-sans font-semibold text-xl text-[var(--color-primary)] leading-none tabular-nums">
        {value}
      </span>
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-on-surface-variant)] opacity-70 truncate group-hover:opacity-100 transition-opacity">
        {label}
      </span>
    </button>
  )
}

function Modals({
  userId,
  open,
  setOpen,
  t,
}: {
  userId: string
  open: FollowKind | null
  setOpen: (next: FollowKind | null) => void
  t: (key: string) => string
}) {
  return (
    <>
      <FollowListModal
        open={open === 'followers'}
        userId={userId}
        kind="followers"
        title={t('profile.followersTitle')}
        emptyMessage={t('profile.noFollowers')}
        t={t}
        onClose={() => setOpen(null)}
      />
      <FollowListModal
        open={open === 'following'}
        userId={userId}
        kind="following"
        title={t('profile.followingTitle')}
        emptyMessage={t('profile.noFollowing')}
        t={t}
        onClose={() => setOpen(null)}
      />
    </>
  )
}
