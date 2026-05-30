/* eslint-disable @typescript-eslint/no-explicit-any -- 'artwork' es JSON poblado del API con forma dinámica; el tipado estricto cascada sin valor real aquí. */
'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import SaveToCollectionModal from './SaveToCollectionModal';
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider';
import { getCategoryLabel, getVisibilityLabel } from '@shared/i18n';

interface ArtworkModalProps {
  artworkId: string;
  isOpen: boolean;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onUpdated?: () => void; // Triggered after edit
}

export default function ArtworkModal({ artworkId, isOpen, onClose, onPrev, onNext, onUpdated }: ArtworkModalProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { locale, t } = usePreferences();

  const [artwork, setArtwork] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados de interacción
  const [isLiking, setIsLiking] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Modo Edición
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const [isSaved, setIsSaved] = useState(false);
  const [isSavingAction, setIsSavingAction] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [showCollectionsModal, setShowCollectionsModal] = useState(false);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Cargar datos
  useEffect(() => {
    if (!isOpen || !artworkId) return;

    const fetchArtwork = async () => {
      setLoading(true);
      setError('');
      setIsEditing(false);
      try {
        const res = await fetch(`/api/artworks/${artworkId}`);
        if (!res.ok) throw new Error(t('modal.loadError'));
        const data = await res.json();
        setArtwork(data);
        
        if (session?.user?.id) {
          if (data.savedBy) {
            setIsSaved(data.savedBy.includes(session.user.id));
          }
          if (data.likedBy) {
            setIsLiked(data.likedBy.includes(session.user.id));
          }
        }

        setEditForm({
          title: data.title || '',
          description: data.description || '',
          category: data.category || 'otro',
          visibility: data.visibility || 'public',
          tags: data.tags ? data.tags.join(', ') : '',
          medium: data.medium || '',
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArtwork();
  }, [artworkId, isOpen, session]);

  // Manejo de ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  if (!isOpen || !isMounted) return null;

  const isOwner = session?.user?.id && artwork?.artistId?._id && session.user.id === artwork.artistId._id;

  const handleLike = async () => {
    if (!session) return alert(t('modal.loginToLike'));
    
    // Optimistic update
    const prevIsLiked = isLiked;
    const prevLikes = artwork.likes || 0;
    
    setIsLiked(!prevIsLiked);
    setArtwork((prev: any) => ({ ...prev, likes: prevIsLiked ? Math.max(0, prevLikes - 1) : prevLikes + 1 }));
    setIsLiking(true);

    try {
      const res = await fetch(`/api/artworks/${artworkId}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like' })
      });
      if (res.ok) {
        const data = await res.json();
        setArtwork((prev: any) => ({ ...prev, likes: data.likes }));
        setIsLiked(data.liked);
      } else {
        setIsLiked(prevIsLiked);
        setArtwork((prev: any) => ({ ...prev, likes: prevLikes }));
      }
    } catch (err) {
      setIsLiked(prevIsLiked);
      setArtwork((prev: any) => ({ ...prev, likes: prevLikes }));
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/artworks/${artworkId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(t('modal.deleteError'));
      
      onClose();
      router.refresh();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(t('modal.deleteError'));
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSave = async () => {
    if (!session) return alert(t('modal.loginToSave'));
    
    if (!isSaved) {
      // Optimistic save
      setIsSaved(true);
      setShowCollectionsModal(true);
      // Also trigger a background save to ensure it is saved even if modal is closed
      try {
        await fetch(`/api/artworks/${artworkId}/interact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save' })
        });
      } catch (err) {}
    } else {
      // Already saved, just open modal to manage
      setShowCollectionsModal(true);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/explore?artworkId=${artworkId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      alert(t('modal.shareError'));
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return alert(t('modal.loginToComment'));
    if (!commentText.trim()) return;
    
    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/artworks/${artworkId}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'comment', text: commentText })
      });
      if (res.ok) {
        const data = await res.json();
        setArtwork((prev: any) => ({
          ...prev,
          comments: [...(prev.comments || []), data.comment]
        }));
        setCommentText('');
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...editForm,
        tags: editForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      };
      const res = await fetch(`/api/artworks/${artworkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(t('modal.saveError'));
      
      const updatedArtwork = await res.json();
      // Actualizar vista local
      setArtwork((prev: any) => ({ ...prev, ...updatedArtwork, artistId: prev.artistId })); // Preservar población
      setIsEditing(false);
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(t('modal.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
      
      {/* Contenedor Principal */}
      <div className="bg-[var(--color-surface-container-lowest)] w-full h-full md:rounded-sm md:h-[90vh] md:max-w-7xl flex flex-col md:flex-row overflow-hidden relative shadow-2xl ring-1 ring-[var(--color-outline-variant)]">
        
        {/* Botones Flotantes (Cerrar, Nav) */}
        <button onClick={onClose} className="absolute top-4 right-4 z-50 bg-black/50 text-white rounded-full p-2 hover:bg-black transition-colors">
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>
        {onPrev && (
          <button onClick={onPrev} className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 text-white rounded-full p-2 hover:bg-black transition-colors hidden md:block">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
        )}
        {onNext && (
          <button onClick={onNext} className="absolute right-[31%] top-1/2 -translate-y-1/2 z-50 bg-black/50 text-white rounded-full p-2 hover:bg-black transition-colors hidden md:block">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        )}

        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-primary)]">
            <span className="material-symbols-outlined animate-spin text-5xl mb-4">refresh</span>
            <p className="font-mono text-sm uppercase tracking-widest">{t('modal.loadTitle')}</p>
          </div>
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center text-[var(--color-error)]">{error}</div>
        ) : (
          <>
            {/* LADO IZQUIERDO: IMAGEN (70% en desktop) */}
            <div className="w-full md:w-[70%] h-[50vh] md:h-full bg-[var(--color-surface-container-low)] relative flex items-center justify-center group overflow-hidden p-4 md:p-8">
              <img 
                src={artwork.imageUrl} 
                alt={artwork.title} 
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 border border-transparent group-hover:border-[var(--color-primary)]/30 pointer-events-none transition-colors duration-500"></div>
            </div>

            {/* LADO DERECHO: INFO Y SOCIAL (30% en desktop) */}
            <div className="w-full md:w-[30%] h-[50vh] md:h-full flex flex-col bg-[var(--color-surface-container-lowest)] border-l border-[var(--color-outline-variant)]">
              
              {/* Info Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                
                {/* Header de la obra */}
                {!isEditing ? (
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
                ) : (
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
                )}
                
                {/* Comentarios (Solo en modo lectura) */}
                {!isEditing && (
                  <div className="mt-8 pt-6 border-t border-[var(--color-outline-variant)]">
                    <h4 className="font-sans font-semibold text-sm text-[var(--color-primary)] mb-4 flex items-center justify-between">
                      {t('modal.comments')} <span className="text-[var(--color-on-surface-variant)] font-mono text-[10px]">{artwork.comments?.length || 0}</span>
                    </h4>
                    
                    <div className="space-y-4 mb-4 max-h-[30vh] overflow-y-auto custom-scrollbar pr-2">
                      {artwork.comments && artwork.comments.length > 0 ? (
                         artwork.comments.map((c: any, idx: number) => (
                           <div key={idx} className="bg-[var(--color-surface-container)] p-3 rounded-sm border border-[var(--color-outline-variant)]">
                              <div className="flex items-center gap-2 mb-2">
                               {c.userAvatar ? <Image src={c.userAvatar} width={20} height={20} className="size-5 rounded-full object-cover" alt="" /> : <div className="size-5 rounded-full bg-slate-950 flex items-center justify-center text-[8px] text-white">{c.userName?.charAt(0)}</div>}
                               <span className="font-sans text-xs font-semibold text-[var(--color-primary)]">{c.userName}</span>
                               <span className="font-mono text-[8px] text-[var(--color-on-surface-variant)] uppercase">
                                 {new Date(c.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                               </span>
                             </div>
                             <p className="font-sans text-xs text-[var(--color-primary)] opacity-90 break-words">{c.text}</p>
                           </div>
                         ))
                      ) : (
                        <p className="text-center font-sans text-xs text-[var(--color-on-surface-variant)] py-4">{t('modal.noComments')}</p>
                      )}
                    </div>

                    {session ? (
                      <form onSubmit={handleComment} className="flex gap-2">
                        <input 
                          type="text" 
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          placeholder={t('modal.addComment')} 
                          className="flex-1 bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] rounded-sm px-3 py-2 text-xs font-sans focus:border-[var(--color-primary)] outline-none text-[var(--color-primary)]"
                        />
                        <button disabled={isSubmittingComment || !commentText.trim()} type="submit" className="bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] shadow-[0_1px_0_var(--color-outline)] px-3 py-2 rounded-sm disabled:opacity-50 hover:bg-[var(--color-primary-container)] transition-colors">
                          <span className="material-symbols-outlined text-[16px] block">send</span>
                        </button>
                      </form>
                    ) : (
                      <div className="text-center bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] rounded-sm p-3">
                        <p className="font-sans text-xs text-[var(--color-on-surface-variant)]">{t('modal.loginToComment')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Bar (Sticky al fondo del panel) */}
              <div className="shrink-0 border-t border-[var(--color-outline-variant)] p-4 flex items-center justify-between bg-[var(--color-surface-container-lowest)] relative z-20">
                <div className="flex items-center gap-4">
                  <button onClick={handleLike} disabled={isLiking} className={`flex items-center gap-1.5 transition-colors group ${isLiked ? 'text-red-500' : 'text-[var(--color-on-surface-variant)] hover:text-red-500'}`}>
                    <span className={`material-symbols-outlined text-[20px] transition-transform ${isLiking ? 'scale-125' : 'group-hover:scale-110'}`} style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>{isLiked ? 'favorite' : 'favorite_border'}</span>
                    <span className="font-mono text-xs">{artwork.likes || 0}</span>
                  </button>
                  <button onClick={handleSave} disabled={isSavingAction} className={`flex items-center gap-1.5 transition-colors group ${isSaved ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]'}`}>
                    <span className={`material-symbols-outlined text-[20px] transition-transform group-hover:scale-110`} style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}>{isSaved ? 'bookmark' : 'bookmark_border'}</span>
                  </button>
                  <button onClick={handleShare} className="flex items-center gap-1.5 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors group relative">
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
                    <button onClick={() => setIsEditing(true)} className="font-mono text-[10px] uppercase tracking-widest border border-[var(--color-primary)] text-[var(--color-primary)] px-4 py-1.5 rounded-sm hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)] transition-colors flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">edit</span> Editar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {showCollectionsModal && (
        <SaveToCollectionModal 
          artworkId={artworkId} 
          onClose={() => setShowCollectionsModal(false)} 
          onSavedStatusChange={(status: boolean) => setIsSaved(status)} 
        />
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}
