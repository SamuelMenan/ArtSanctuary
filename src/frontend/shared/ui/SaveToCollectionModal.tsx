'use client';

import type { Collection } from '@shared/lib/types';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider';

export default function SaveToCollectionModal({ artworkId, onClose, onSavedStatusChange }: { artworkId: string; onClose: () => void; onSavedStatusChange?: (saved: boolean) => void }) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const router = useRouter();
  const { t } = usePreferences();

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    const res = await fetch('/api/collections');
    if (res.ok) {
      const data = await res.json();
      setCollections(data.collections);
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCollectionName })
    });
    if (res.ok) {
      setNewCollectionName('');
      fetchCollections();
    }
  };

  const handleToggle = async (collection: Collection) => {
    setSavingId(collection._id);
    const hasArtwork = collection.artworks?.includes(artworkId);
    
    if (hasArtwork) {
      const res = await fetch(`/api/collections/${collection._id}/artworks?artworkId=${artworkId}`, { method: 'DELETE' });
      if (res.ok) {
        const newCols = collections.map(c => c._id === collection._id ? { ...c, artworks: c.artworks.filter((id: string) => id !== artworkId) } : c);
        setCollections(newCols);
        const stillSaved = newCols.some(c => c.artworks?.includes(artworkId));
        if (!stillSaved && onSavedStatusChange) onSavedStatusChange(false);
        onClose();
        router.push(`/collections/${collection._id}`);
      }
    } else {
      const res = await fetch(`/api/collections/${collection._id}/artworks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId })
      });
      if (res.ok) {
        const newCols = collections.map(c => c._id === collection._id ? { ...c, artworks: [...(c.artworks || []), artworkId] } : c);
        setCollections(newCols);
        if (onSavedStatusChange) onSavedStatusChange(true);
        onClose();
        router.push(`/collections/${collection._id}`);
      }
    }
    setSavingId(null);
  };

  const handleUnsaveAll = async () => {
    // Optimistic close and notify
    if (onSavedStatusChange) onSavedStatusChange(false);
    onClose();

    // Call unsave generic interact
    await fetch(`/api/artworks/${artworkId}/interact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unsave' })
    });

    // We should ideally remove from all collections in backend too.
    // For now, this just removes the generic save. The backend can be optimized later to sync.
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[var(--color-surface-container-lowest)] w-full max-w-sm rounded-sm shadow-2xl overflow-hidden ring-1 ring-[var(--color-outline-variant)]">
        <div className="p-4 border-b border-[var(--color-outline-variant)] flex items-center justify-between">
          <h3 className="font-sans font-bold text-[var(--color-primary)]">{t('modal.saveToCollection')}</h3>
          <button type="button" onClick={onClose} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="p-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
          {loading ? (
             <div className="flex justify-center p-4"><span className="material-symbols-outlined animate-spin text-[var(--color-primary)]">refresh</span></div>
          ) : collections.length === 0 ? (
             <p className="text-sm font-sans text-[var(--color-on-surface-variant)] text-center py-4">{t('sidebar.noCollections')}</p>
          ) : (
            <div className="space-y-2">
              {collections.map(c => {
                const isSaved = c.artworks?.includes(artworkId);
                return (
                  <button
                    type="button"
                    key={c._id}
                    onClick={() => handleToggle(c)}
                    disabled={savingId === c._id}
                    className="w-full flex items-center justify-between p-3 rounded-sm border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] transition-colors text-left group bg-[var(--color-surface-container)]"
                  >
                    <span className="font-sans text-sm text-[var(--color-primary)]">{c.name}</span>
                    {savingId === c._id ? (
                      <span className="material-symbols-outlined animate-spin text-[var(--color-primary)] text-sm">refresh</span>
                    ) : isSaved ? (
                      <span className="material-symbols-outlined text-[var(--color-primary)] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    ) : (
                      <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-sm group-hover:text-[var(--color-primary)]">add_circle</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-container)]">
          <form onSubmit={handleCreate} className="flex gap-2">
            <input 
              type="text" 
              placeholder={t('modal.newCollection')} 
              value={newCollectionName}
              onChange={e => setNewCollectionName(e.target.value)}
              className="flex-1 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-sm px-3 py-2 text-xs font-sans focus:border-[var(--color-primary)] outline-none text-[var(--color-primary)]"
            />
            <button type="submit" disabled={!newCollectionName.trim() || loading} className="bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] shadow-[0_1px_0_var(--color-outline)] px-3 py-2 rounded-sm disabled:opacity-50 text-xs font-mono uppercase tracking-widest">
              Crear
            </button>
          </form>
          
          <div className="mt-4 pt-4 border-t border-[var(--color-outline-variant)]">
            <button type="button" onClick={handleUnsaveAll} className="w-full text-center text-red-500 font-mono text-[10px] uppercase tracking-widest py-2 hover:bg-red-500/10 rounded-sm transition-colors">
              Eliminar de mis guardados
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
