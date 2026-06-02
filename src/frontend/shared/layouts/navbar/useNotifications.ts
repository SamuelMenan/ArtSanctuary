'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export interface AppNotification {
  _id: string
  type: 'like' | 'comment' | 'save' | 'follow' | string
  read?: boolean
  message?: string
  origin?: string
  createdAt: string
  actorId?: { _id?: string; displayName?: string; username?: string } | null
  artworkId?: { _id?: string; title?: string } | null
}

export function useNotifications(onNavigate?: () => void) {
  const { status } = useSession()
  const { push } = useRouter()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Cargar notificaciones periódicamente
  useEffect(() => {
    if (status !== 'authenticated') return;

    const buildApiUrl = (path: string) => {
      if (typeof window === 'undefined') return path
      return new URL(path, window.location.origin).toString()
    }

    let ignore = false;
    const fetchNotifs = async () => {
      try {
        const res = await window.fetch(buildApiUrl('/api/notifications'), {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        })
        if (!res.ok) return

        const data = await res.json();
        if (!ignore && data.notifications) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      } catch (err) {
        console.error('[Navbar notifications fetch]', err);
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000); // Polling cada 30s
    return () => { ignore = true; clearInterval(interval); };
  }, [status]);

  const markAllAsRead = async () => {
    try {
      const endpoint = typeof window === 'undefined'
        ? '/api/notifications/read-all'
        : new URL('/api/notifications/read-all', window.location.origin).toString()

      await fetch(endpoint, {
        method: 'PATCH',
        credentials: 'include',
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('[Navbar mark all read]', err);
    }
  };

  const handleNotifClick = async (n: AppNotification) => {
    if (!n.read) {
      try {
        const endpoint = typeof window === 'undefined'
          ? `/api/notifications/${n._id}/read`
          : new URL(`/api/notifications/${n._id}/read`, window.location.origin).toString()

        await fetch(endpoint, {
          method: 'PATCH',
          credentials: 'include',
        });
        setNotifications(prev => prev.map(notif => notif._id === n._id ? { ...notif, read: true } : notif));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('[Navbar read notification]', err);
      }
    }
    if (n.type === 'follow' && n.actorId?._id) {
      onNavigate?.();
      push(`/profile/${n.actorId._id}`);
    } else if (n.artworkId?._id) {
      onNavigate?.();
      push(`/explore?artworkId=${n.artworkId._id}`);
    }
  };

  return { notifications, unreadCount, markAllAsRead, handleNotifClick };
}
