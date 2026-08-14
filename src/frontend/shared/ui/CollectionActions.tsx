'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider';
import { useCollections } from '@frontend/shared/providers/CollectionsProvider';

export default function CollectionActions({ collectionId, initialName }: { collectionId: string, initialName: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = usePreferences();
  const { refresh } = useCollections();

  const handleRename = async () => {
    if (!name.trim() || name === initialName) {
      setIsEditing(false);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/collections/${collectionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (res.ok) {
      setIsEditing(false);
      void refresh();
      router.refresh();
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm(t('common.deleteCollectionConfirm'))) return;
    setLoading(true);
    const res = await fetch(`/api/collections/${collectionId}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      void refresh();
      router.push('/');
    } else {
      setLoading(false);
      alert(t('common.deleteCollectionError'));
    }
  };

  if (isEditing) {
    return (
      <div className="flex gap-2 items-center mb-2">
        <input 
          type="text" 
          aria-label={t('common.collectionNameLabel')}
          value={name} 
          onChange={e => setName(e.target.value)} 
          className="bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] px-3 py-1 text-sm font-sans focus:border-[var(--color-primary)] outline-none text-[var(--color-primary)] rounded-sm"
        />
        <button type="button" onClick={handleRename} disabled={loading} className="text-xs font-mono uppercase bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] shadow-[0_1px_0_var(--color-outline)] px-3 py-1 rounded-sm">{t('common.save')}</button>
        <button type="button" onClick={() => setIsEditing(false)} disabled={loading} className="text-xs font-mono uppercase border border-[var(--color-outline-variant)] text-[var(--color-primary)] px-3 py-1 rounded-sm">Cancelar</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <h1 className="text-4xl font-display-lg tracking-[-0.02em] text-[var(--color-primary)] font-bold">
        {name}
      </h1>
      <button type="button" onClick={() => setIsEditing(true)} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">
        <span className="material-symbols-outlined text-[20px]">edit</span>
      </button>
      <button type="button" onClick={handleDelete} className="text-[var(--color-on-surface-variant)] hover:text-red-500 transition-colors">
        <span className="material-symbols-outlined text-[20px]">delete</span>
      </button>
    </div>
  );
}
