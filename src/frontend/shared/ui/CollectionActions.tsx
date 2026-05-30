'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CollectionActions({ collectionId, initialName }: { collectionId: string, initialName: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      router.refresh();
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta colección? Esta acción no se puede deshacer.')) return;
    setLoading(true);
    const res = await fetch(`/api/collections/${collectionId}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      router.push('/');
    } else {
      setLoading(false);
      alert('Error al eliminar la colección');
    }
  };

  if (isEditing) {
    return (
      <div className="flex gap-2 items-center mb-2">
        <input 
          type="text" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          className="bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] px-3 py-1 text-sm font-sans focus:border-[var(--color-primary)] outline-none text-[var(--color-primary)] rounded-sm"
        />
        <button onClick={handleRename} disabled={loading} className="text-xs font-mono uppercase bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] shadow-[0_1px_0_var(--color-outline)] px-3 py-1 rounded-sm">Guardar</button>
        <button onClick={() => setIsEditing(false)} disabled={loading} className="text-xs font-mono uppercase border border-[var(--color-outline-variant)] text-[var(--color-primary)] px-3 py-1 rounded-sm">Cancelar</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <h1 className="text-4xl font-display-lg tracking-[-0.02em] text-[var(--color-primary)] font-bold">
        {name}
      </h1>
      <button onClick={() => setIsEditing(true)} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">
        <span className="material-symbols-outlined text-[20px]">edit</span>
      </button>
      <button onClick={handleDelete} className="text-[var(--color-on-surface-variant)] hover:text-red-500 transition-colors">
        <span className="material-symbols-outlined text-[20px]">delete</span>
      </button>
    </div>
  );
}
