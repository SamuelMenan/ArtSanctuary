/* eslint-disable @typescript-eslint/no-explicit-any -- 'artwork' es JSON poblado del API con forma dinámica; el tipado estricto cascada sin valor real aquí. */
'use client';

interface ArtworkActionsProps {
  artwork: any;
  isLiking: boolean;
  isLiked: boolean;
  handleLike: () => void;
  isSaved: boolean;
  isSavingAction: boolean;
  handleSave: () => void;
  handleShare: () => void;
  copyFeedback: boolean;
  isOwner: any;
  isAdmin: boolean;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (v: boolean) => void;
  handleDelete: () => void;
  isDeleting: boolean;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  t: (key: string) => string;
}

export default function ArtworkActions({
  artwork,
  isLiking,
  isLiked,
  handleLike,
  isSaved,
  isSavingAction,
  handleSave,
  handleShare,
  copyFeedback,
  isOwner,
  isAdmin,
  showDeleteConfirm,
  setShowDeleteConfirm,
  handleDelete,
  isDeleting,
  isEditing,
  setIsEditing,
  t,
}: ArtworkActionsProps) {
  return (
    /* Action Bar (Sticky al fondo del panel) */
    <div className="shrink-0 border-t border-[var(--color-outline-variant)] p-4 flex items-center justify-between bg-[var(--color-surface-container-lowest)] relative z-20">
      <div className="flex items-center gap-4">
        <button type="button" onClick={handleLike} disabled={isLiking} className={`flex items-center gap-1.5 transition-colors group ${isLiked ? 'text-red-500' : 'text-[var(--color-on-surface-variant)] hover:text-red-500'}`}>
          <span className={`material-symbols-outlined text-[20px] transition-transform ${isLiking ? 'scale-125' : 'group-hover:scale-110'}`} style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>{isLiked ? 'favorite' : 'favorite_border'}</span>
          <span className="font-mono text-xs">{artwork.likes || 0}</span>
        </button>
        <button type="button" onClick={handleSave} disabled={isSavingAction} className={`flex items-center gap-1.5 transition-colors group ${isSaved ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]'}`}>
          <span className={`material-symbols-outlined text-[20px] transition-transform group-hover:scale-110`} style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}>{isSaved ? 'bookmark' : 'bookmark_border'}</span>
        </button>
        <button type="button" onClick={handleShare} className="flex items-center gap-1.5 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors group relative">
          <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">share</span>
          {copyFeedback && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-[10px] font-mono px-2 py-1 rounded whitespace-nowrap animate-in fade-in slide-in-from-bottom-1">
              {t('common.copied')}
            </span>
          )}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] text-[var(--color-on-surface-variant)] hidden xl:block uppercase tracking-widest">{artwork.views || 0} Vistas</span>
        {isOwner && !isEditing && (
          <button type="button" onClick={() => setIsEditing(true)} className="font-mono text-[10px] uppercase tracking-widest border border-[var(--color-primary)] text-[var(--color-primary)] px-4 py-1.5 rounded-sm hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)] transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">edit</span> Editar
          </button>
        )}
        {isAdmin && !isOwner && !isEditing && (
          <button type="button" onClick={() => setShowDeleteConfirm(true)} className="font-mono text-[10px] uppercase tracking-widest border border-red-500/50 text-red-500 px-4 py-1.5 rounded-sm hover:bg-red-500 hover:text-white transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">delete</span> Eliminar
          </button>
        )}
      </div>
      {isAdmin && !isOwner && !isEditing && showDeleteConfirm && (
        <div className="absolute bottom-full right-4 mb-2 w-64 p-3 border border-red-500/30 bg-[var(--color-surface-container-lowest)] rounded-sm shadow-lg">
          <p className="text-red-500 font-sans text-xs mb-3">¿Eliminar esta publicación como administrador?</p>
          <div className="flex gap-2">
            <button type="button" onClick={handleDelete} disabled={isDeleting} className="flex-1 bg-red-500 text-white font-mono text-[10px] uppercase tracking-widest py-2 rounded-sm hover:bg-red-600 transition-colors">
              {isDeleting ? 'Eliminando...' : 'Confirmar'}
            </button>
            <button type="button" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} className="flex-1 border border-red-500/30 text-red-500 font-mono text-[10px] uppercase tracking-widest py-2 rounded-sm hover:bg-red-500/10 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
