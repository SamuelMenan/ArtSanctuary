'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
};

type Collection = { _id: string; name: string };

type CollectionDetail = {
  references?: { imageUrl: string; caption?: string }[];
  artworks?: { _id: string; title?: string; imageUrl: string }[];
};

export default function ImageSourceModal({ onClose, onSelect }: Props) {
  const [tab, setTab] = useState<'upload' | 'collections'>('upload');
  const [mounted, setMounted] = useState(false);

  // Subida
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Colecciones
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [openCollection, setOpenCollection] = useState<Collection | null>(null);
  const [detail, setDetail] = useState<CollectionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (tab !== 'collections' || collections.length > 0) return;
    setLoadingList(true);
    fetch('/api/collections')
      .then((r) => (r.ok ? r.json() : { collections: [] }))
      .then((d) => setCollections(d.collections ?? []))
      .finally(() => setLoadingList(false));
  }, [tab, collections.length]);

  const openDetail = async (c: Collection) => {
    setOpenCollection(c);
    setDetail(null);
    setLoadingDetail(true);
    const res = await fetch(`/api/collections/${c._id}`);
    if (res.ok) {
      const data = await res.json();
      setDetail(data.collection);
    }
    setLoadingDetail(false);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    setUploading(false);
    if (res.ok) {
      const data = await res.json();
      onSelect(data.imageUrl);
    } else {
      const data = await res.json().catch(() => ({}));
      setUploadError(data.error ?? 'Error al subir la imagen');
    }
  };

  if (!mounted) return null;

  const tabClass = (active: boolean) =>
    `flex-1 py-3 font-mono text-[var(--text-label-sm)] uppercase tracking-widest transition-colors ${
      active
        ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
        : 'text-[var(--color-on-surface-variant)] border-b-2 border-transparent hover:text-[var(--color-primary)]'
    }`;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[var(--color-surface-container-lowest)] w-full max-w-lg rounded-sm shadow-2xl overflow-hidden ring-1 ring-[var(--color-outline-variant)] flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-outline-variant)] flex items-center justify-between shrink-0">
          <h3 className="font-sans font-bold text-[var(--color-primary)]">Seleccionar imagen</h3>
          <button onClick={onClose} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--color-outline-variant)] shrink-0">
          <button onClick={() => setTab('upload')} className={tabClass(tab === 'upload')}>
            Subir
          </button>
          <button
            onClick={() => {
              setTab('collections');
              setOpenCollection(null);
            }}
            className={tabClass(tab === 'collections')}
          >
            Colecciones
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
          {tab === 'upload' ? (
            <label className="flex flex-col items-center justify-center gap-3 py-12 border-2 border-dashed border-[var(--color-outline-variant)] rounded-sm cursor-pointer hover:border-[var(--color-primary)] transition-colors text-center">
              <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-4xl">
                {uploading ? 'hourglass_top' : 'upload_file'}
              </span>
              <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] uppercase tracking-widest">
                {uploading ? 'Subiendo…' : 'Click para subir imagen'}
              </span>
              <span className="font-sans text-xs text-[var(--color-on-surface-variant)]/70">
                JPG, PNG, WEBP o GIF · máx 10MB
              </span>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={uploading} onChange={handleFile} />
              {uploadError && <span className="text-red-500 font-sans text-xs">{uploadError}</span>}
            </label>
          ) : openCollection ? (
            <div>
              <button
                onClick={() => setOpenCollection(null)}
                className="flex items-center gap-1 mb-3 font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] uppercase tracking-widest"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                {openCollection.name}
              </button>
              {loadingDetail ? (
                <div className="flex justify-center p-8">
                  <span className="material-symbols-outlined animate-spin text-[var(--color-primary)]">refresh</span>
                </div>
              ) : (
                (() => {
                  const imgs = [
                    ...(detail?.references?.map((r) => r.imageUrl) ?? []),
                    ...(detail?.artworks?.map((a) => a.imageUrl) ?? []),
                  ].filter(Boolean);
                  if (imgs.length === 0)
                    return (
                      <p className="text-center py-8 font-sans text-sm text-[var(--color-on-surface-variant)]">
                        Esta colección no tiene imágenes.
                      </p>
                    );
                  return (
                    <div className="grid grid-cols-3 gap-2">
                      {imgs.map((src, i) => (
                        <button
                          key={`${src}-${i}`}
                          onClick={() => onSelect(src)}
                          className="aspect-square overflow-hidden rounded-sm border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] transition-colors group"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </button>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>
          ) : loadingList ? (
            <div className="flex justify-center p-8">
              <span className="material-symbols-outlined animate-spin text-[var(--color-primary)]">refresh</span>
            </div>
          ) : collections.length === 0 ? (
            <p className="text-center py-8 font-sans text-sm text-[var(--color-on-surface-variant)]">No tienes colecciones aún.</p>
          ) : (
            <div className="space-y-2">
              {collections.map((c) => (
                <button
                  key={c._id}
                  onClick={() => openDetail(c)}
                  className="w-full flex items-center justify-between p-3 rounded-sm border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] transition-colors text-left bg-[var(--color-surface-container)]"
                >
                  <span className="font-sans text-sm text-[var(--color-primary)]">{c.name}</span>
                  <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-sm">chevron_right</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
