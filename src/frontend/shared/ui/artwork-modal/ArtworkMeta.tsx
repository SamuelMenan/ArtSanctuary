/* eslint-disable @typescript-eslint/no-explicit-any -- 'artwork' es JSON poblado del API con forma dinámica; el tipado estricto cascada sin valor real aquí. */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { getCategoryLabel, getVisibilityLabel } from '@shared/i18n';

interface ArtworkMetaProps {
  artwork: any;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  editForm: any;
  setEditForm: (v: any) => void;
  isSaving: boolean;
  handleSaveEdit: () => void;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (v: boolean) => void;
  handleDelete: () => void;
  isDeleting: boolean;
  locale: any;
  t: (key: string) => string;
}

export default function ArtworkMeta({
  artwork,
  isEditing,
  setIsEditing,
  editForm,
  setEditForm,
  isSaving,
  handleSaveEdit,
  showDeleteConfirm,
  setShowDeleteConfirm,
  handleDelete,
  isDeleting,
  locale,
  t,
}: ArtworkMetaProps) {
  if (!isEditing) {
    return (
      <>
        <h2 className="text-3xl font-sans font-semibold text-[var(--color-primary)] leading-tight tracking-tight mb-2">
          {artwork.title}
        </h2>

        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[var(--color-outline-variant)]">
          {artwork.artistId?.avatarUrl ? (
            <Image src={artwork.artistId.avatarUrl} width={40} height={40} className="size-10 rounded-full border border-[var(--color-outline-variant)] object-cover" alt="Artist Avatar" />
          ) : (
            <div className="size-10 rounded-full bg-[var(--color-surface-container)] flex items-center justify-center text-xs font-semibold text-[var(--color-primary)] border border-[var(--color-outline-variant)]">
              {artwork.artistId?.displayName?.charAt(0) || artwork.artistId?.username?.charAt(0) || 'U'}
            </div>
          )}
          <div>
            <Link href={`/profile/${artwork.artistId?._id}`} className="font-sans font-semibold text-[var(--color-primary)] hover:underline text-sm block">
              {artwork.artistId?.displayName || artwork.artistId?.username || 'Autor Desconocido'}
            </Link>
            <p className="font-mono text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-widest">
              {getCategoryLabel(locale, artwork.category)} • {new Date(artwork.uploadDate).getFullYear()}
            </p>
          </div>
        </div>

        {/* Descripción y Detalles */}
        <div className="space-y-6">
          {artwork.description && (
            <div>
              <h4 className="font-mono text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-sm">subject</span> {t('modal.context')}</h4>
              <p className="font-sans text-sm text-[var(--color-primary)] leading-relaxed whitespace-pre-wrap">{artwork.description}</p>
            </div>
          )}

          <div className="bg-[var(--color-surface-container)] p-4 rounded-sm border border-[var(--color-outline-variant)]">
            <h4 className="font-mono text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-3 border-b border-[var(--color-outline-variant)] pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">architecture</span> {t('modal.details')}
            </h4>
            <ul className="space-y-2 font-sans text-xs text-[var(--color-primary)]">
              {artwork.medium && <li><strong className="font-semibold text-[var(--color-on-surface-variant)]">{t('modal.support')}:</strong> {artwork.medium}</li>}
              {artwork.technique && <li><strong className="font-semibold text-[var(--color-on-surface-variant)]">{t('modal.discipline')}:</strong> {artwork.technique}</li>}
              {artwork.dimensions?.width && <li><strong className="font-semibold text-[var(--color-on-surface-variant)]">{t('upload.dimensions')}:</strong> {artwork.dimensions.width}x{artwork.dimensions.height}{artwork.dimensions.depth ? `x${artwork.dimensions.depth}` : ''} {artwork.dimensions.unit}</li>}
              {artwork.visibility && <li><strong className="font-semibold text-[var(--color-on-surface-variant)]">{t('modal.visibility')}:</strong> <span className="uppercase text-[10px] font-mono bg-black/20 px-1 py-0.5 rounded">{getVisibilityLabel(locale, artwork.visibility)}</span></li>}
            </ul>
          </div>

          {artwork.tags && artwork.tags.length > 0 && (
            <div>
              <h4 className="font-mono text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-sm">sell</span> {t('modal.tags')}</h4>
              <div className="flex flex-wrap gap-2">
                {artwork.tags.map((tag: string) => (
                  <span key={tag} className="font-mono text-[10px] border border-[var(--color-outline-variant)] px-2 py-1 text-[var(--color-primary)] hover:bg-[var(--color-surface-container)] transition-colors cursor-pointer rounded-sm">#{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    /* MODO EDICIÓN */
    <div className="space-y-4 animate-in fade-in">
      <h3 className="font-sans font-semibold text-lg text-[var(--color-primary)] border-b border-[var(--color-outline-variant)] pb-2 mb-4">{t('modal.editMetadata')}</h3>

      <div className="space-y-1">
        <label className="font-mono text-[10px] uppercase text-[var(--color-on-surface-variant)]">{t('modal.title')}</label>
        <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] px-3 py-2 text-sm text-[var(--color-primary)] rounded-sm focus:border-[var(--color-primary)] outline-none" />
      </div>

      <div className="space-y-1">
        <label className="font-mono text-[10px] uppercase text-[var(--color-on-surface-variant)]">{t('upload.description')}</label>
        <textarea value={editForm.description} rows={4} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] px-3 py-2 text-sm text-[var(--color-primary)] rounded-sm focus:border-[var(--color-primary)] outline-none resize-none" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="font-mono text-[10px] uppercase text-[var(--color-on-surface-variant)]">{t('modal.discipline')}</label>
          <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} className="w-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] px-3 py-2 text-sm text-[var(--color-primary)] rounded-sm focus:border-[var(--color-primary)] outline-none">
            <option value="pintura">Pintura</option>
            <option value="escultura">Escultura</option>
            <option value="ilustracion">Ilustración</option>
            <option value="fotografia">Fotografía</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="font-mono text-[10px] uppercase text-[var(--color-on-surface-variant)]">{t('modal.visibility')}</label>
          <select value={editForm.visibility} onChange={e => setEditForm({...editForm, visibility: e.target.value})} className="w-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] px-3 py-2 text-sm text-[var(--color-primary)] rounded-sm focus:border-[var(--color-primary)] outline-none">
            <option value="public">{t('upload.public')}</option>
            <option value="unlisted">{t('upload.unlisted')}</option>
            <option value="private">{t('upload.private')}</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="font-mono text-[10px] uppercase text-[var(--color-on-surface-variant)]">{t('modal.support')}</label>
        <input type="text" value={editForm.medium} onChange={e => setEditForm({...editForm, medium: e.target.value})} className="w-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] px-3 py-2 text-sm text-[var(--color-primary)] rounded-sm focus:border-[var(--color-primary)] outline-none" />
      </div>

      <div className="space-y-1">
        <label className="font-mono text-[10px] uppercase text-[var(--color-on-surface-variant)]">{t('modal.tags')}</label>
        <input type="text" value={editForm.tags} onChange={e => setEditForm({...editForm, tags: e.target.value})} className="w-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] px-3 py-2 text-sm text-[var(--color-primary)] rounded-sm focus:border-[var(--color-primary)] outline-none" />
      </div>

      <div className="pt-4 flex gap-2 border-t border-[var(--color-outline-variant)] mt-6">
        <button onClick={handleSaveEdit} disabled={isSaving} className="flex-1 bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] shadow-[0_1px_0_var(--color-outline)] font-mono text-[10px] uppercase tracking-widest py-3 hover:bg-[var(--color-primary-container)] rounded-sm transition-colors flex items-center justify-center gap-2">
          {isSaving ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : t('modal.save')}
        </button>
        <button onClick={() => setShowDeleteConfirm(true)} disabled={isSaving} className="flex-1 bg-red-500/10 text-red-500 border border-red-500/20 font-mono text-[10px] uppercase tracking-widest py-3 hover:bg-red-500 hover:text-white rounded-sm transition-colors">
          {t('modal.delete')}
        </button>
        <button onClick={() => setIsEditing(false)} disabled={isSaving} className="flex-1 border border-[var(--color-outline-variant)] text-[var(--color-primary)] font-mono text-[10px] uppercase tracking-widest py-3 hover:bg-[var(--color-surface-container)] rounded-sm transition-colors">
          {t('modal.cancel')}
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="mt-4 p-4 border border-red-500/30 bg-red-500/5 rounded-sm animate-in fade-in slide-in-from-top-2">
          <p className="text-red-500 font-sans text-sm mb-4 text-center">{t('modal.confirmDelete')}</p>
          <div className="flex gap-2">
            <button onClick={handleDelete} disabled={isDeleting} className="flex-1 bg-red-500 text-white font-mono text-[10px] uppercase tracking-widest py-2 rounded-sm hover:bg-red-600 transition-colors flex justify-center items-center gap-2">
              {isDeleting ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : t('modal.yesDelete')}
            </button>
            <button onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} className="flex-1 border border-red-500/30 text-red-500 font-mono text-[10px] uppercase tracking-widest py-2 rounded-sm hover:bg-red-500/10 transition-colors">
              {t('modal.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
