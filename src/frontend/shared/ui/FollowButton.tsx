'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider';
import Spinner from './Spinner';

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({ targetUserId, initialIsFollowing, onFollowChange }: FollowButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = usePreferences();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (!session?.user) {
      alert(t('common.loginToFollow'));
      return;
    }

    if (isLoading) return;

    const previousState = isFollowing;
    setIsFollowing(!previousState);
    if (onFollowChange) onFollowChange(!previousState);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/users/${targetUserId}/follow`, {
        method: previousState ? 'DELETE' : 'POST',
      });

      if (!res.ok) {
        throw new Error(t('common.followError'));
      }

      router.refresh(); // Actualizar Server Components (como el contador)
    } catch (err) {
      setIsFollowing(previousState);
      if (onFollowChange) onFollowChange(previousState);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      className={`font-mono text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-sm transition-colors flex items-center justify-center gap-1 min-w-[100px] ${
        isFollowing 
          ? 'border border-[var(--color-outline-variant)] text-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)]' 
          : 'bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] shadow-[0_1px_0_var(--color-outline)] hover:bg-[var(--color-primary-container)]'
      }`}
    >
      {isLoading && <Spinner className="size-3" />}
      {isFollowing ? t('common.following') : t('common.follow')}
    </button>
  );
}
