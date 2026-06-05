'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider';
import { useCollections } from '@frontend/shared/providers/CollectionsProvider';
import { scaleIn, transition } from '@frontend/shared/motion/tokens';

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
  const { t } = usePreferences();
  const [mounted, setMounted] = useState(false);
  // Salida auto-contenida: `visible` controla el ciclo de AnimatePresence; al
  // terminar la animación de salida se ejecuta la acción real (cerrar o elegir).
  const [visible, setVisible] = useState(true);
  const pendingSelect = useRef<string | null>(null);
  const requestClose = useCallback(() => { pendingSelect.current = null; setVisible(false); }, []);
  const requestSelect = useCallback((src: string) => { pendingSelect.current = src; setVisible(false); }, []);
  const onExitComplete = () => {
    const src = pendingSelect.current;
    pendingSelect.current = null;
    if (src != null) onSelect(src); else onClose();
  };

  // Subida
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Colecciones (lista desde la caché compartida; detalle bajo demanda).
  const { collections, loading: loadingList } = useCollections();
  const [openCollection, setOpenCollection] = useState<Collection | null>(null);
  const [detail, setDetail] = useState<CollectionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => setMounted(true), []);

  // Cerrar con Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') requestClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [requestClose]);

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
      requestSelect(data.imageUrl);
    } else {
      const data = await res.json().catch(() => ({}));
      setUploadError(data?.error?.message ?? t('imageModal.uploadError'));
    }
  };

  if (!mounted) return null;

  const tabClass = (active: boolean) =>
    `flex-1 py-3 font-mono text-label-sm uppercase tracking-widest transition-colors ${
      active
        ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
        : 'text-[var(--color-on-surface-variant)] border-b-2 border-transparent hover:text-[var(--color-primary)]'
    }`;

  return createPortal(
    <AnimatePresence onExitComplete={onExitComplete}>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) requestClose(); }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition.fast}
        >
          <motion.div
            className="bg-[var(--color-surface-container-lowest)] w-full max-w-lg rounded-sm shadow-2xl overflow-hidden ring-1 ring-[var(--color-outline-variant)] flex flex-col max-h-[80vh]"
            role="dialog"
            aria-modal="true"
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
          >
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-outline-variant)] flex items-center justify-between shrink-0">
          <h3 className="font-sans font-bold text-[var(--color-primary)]">{t('imageModal.title')}</h3>
          <button onClick={requestClose} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--color-outline-variant)] shrink-0">
          <button onClick={() => setTab('upload')} className={tabClass(tab === 'upload')}>{t('imageModal.tabUpload')}</button>
          <button
            onClick={() => {
              setTab('collections');
              setOpenCollection(null);
            }}
            className={tabClass(tab === 'collections')}
          >{t('imageModal.tabCollections')}</button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
          {tab === 'upload' ? (
            <label className="flex flex-col items-center justify-center gap-3 py-12 border-2 border-dashed border-[var(--color-outline-variant)] rounded-sm cursor-pointer hover:border-[var(--color-primary)] transition-colors text-center">
              <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-4xl">
                {uploading ? 'hourglass_top' : 'upload_file'}
              </span>
              <span className="font-mono text-label-sm text-[var(--color-on-surface-variant)] uppercase tracking-widest">
                {uploading ? t('imageModal.uploading') : t('imageModal.uploadPrompt')}
              </span>
              <span className="font-sans text-xs text-[var(--color-on-surface-variant)]/70">{t('imageModal.uploadHint')}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={uploading} onChange={handleFile} />
              {uploadError && <span className="text-red-500 font-sans text-xs">{uploadError}</span>}
            </label>
          ) : openCollection ? (
            <div>
              <button
                onClick={() => setOpenCollection(null)}
                className="flex items-center gap-1 mb-3 font-mono text-label-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] uppercase tracking-widest"
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
                      <p className="text-center py-8 font-sans text-sm text-[var(--color-on-surface-variant)]">{t('imageModal.emptyCollection')}</p>
                    );
                  return (
                    <div className="grid grid-cols-3 gap-2">
                      {imgs.map((src, i) => (
                        <button
                          key={`${src}-${i}`}
                          onClick={() => requestSelect(src)}
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
            <p className="text-center py-8 font-sans text-sm text-[var(--color-on-surface-variant)]">{t('sidebar.noCollections')}</p>
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
