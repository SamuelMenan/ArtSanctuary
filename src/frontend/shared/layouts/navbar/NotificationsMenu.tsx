'use client'

import { useNotifications } from './useNotifications'

interface NotificationsMenuProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  notifRef: React.RefObject<HTMLDivElement | null>
  t: (key: string) => string
}

export default function NotificationsMenu({ isOpen, setIsOpen, notifRef, t }: NotificationsMenuProps) {
  const { notifications, unreadCount, markAllAsRead, handleNotifClick } = useNotifications(() => setIsOpen(false))

  return (
    <div className="relative" ref={notifRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] flex items-center justify-center p-2 rounded-full hover:bg-[var(--color-surface-container-low)] transition-all duration-200 focus:outline-none relative"
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 size-2 bg-[var(--color-primary)] rounded-full animate-pulse"></span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)] rounded-sm shadow-xl flex flex-col z-50 overflow-hidden">
          <div className="p-4 border-b border-[var(--color-outline-variant)] flex justify-between items-center bg-[var(--color-surface-container)]">
            <span className="font-sans font-semibold text-[var(--color-primary)] text-sm">{t('menu.notifications')}</span>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllAsRead} className="font-mono text-[10px] text-[var(--color-on-surface-variant)] uppercase hover:text-[var(--color-primary)] transition-colors">
                {t('menu.markAllRead')}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto custom-scrollbar flex flex-col">
            {notifications.length > 0 ? notifications.map((n) => (
              <button
                type="button"
                key={n._id}
                onClick={() => handleNotifClick(n)}
                className={`w-full text-left p-4 border-b border-[var(--color-outline-variant)] flex items-start gap-3 hover:bg-[var(--color-surface-container-low)] transition-colors cursor-pointer ${!n.read ? 'bg-[var(--color-surface-container-lowest)] border-l-2 border-l-[var(--color-primary)]' : 'opacity-70'}`}
              >
                <div className="shrink-0 mt-1">
                  <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-lg">
                    {n.type === 'like' ? 'favorite' : n.type === 'comment' ? 'chat_bubble' : n.type === 'save' ? 'bookmark' : 'person_add'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-xs text-[var(--color-primary)]">
                    <strong className="font-semibold">{n.actorId?.displayName || n.actorId?.username || 'Usuario'}</strong>
                    {n.type === 'like' ? ' le dio me gusta a tu obra ' : n.type === 'comment' ? ' comentó en tu obra ' : n.type === 'save' ? ' guardó tu obra en una colección ' : ' te empezó a seguir '}
                    {n.artworkId && <span className="italic">&quot;{n.artworkId?.title}&quot;</span>}
                  </p>
                  {n.message && (
                    <p className="font-sans text-[10px] text-[var(--color-on-surface-variant)] mt-1 truncate border-l border-[var(--color-outline-variant)] pl-2">{n.message}</p>
                  )}
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-on-surface-variant)] mt-2 block">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </button>
            )) : (
              <div className="p-8 text-center text-[var(--color-on-surface-variant)] font-sans text-xs">
                {t('menu.noNotifications')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
