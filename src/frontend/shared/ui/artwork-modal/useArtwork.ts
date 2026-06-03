/* eslint-disable @typescript-eslint/no-explicit-any -- 'artwork' es JSON poblado del API con forma dinámica; el tipado estricto cascada sin valor real aquí. */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider';

interface UseArtworkParams {
  artworkId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void; // Triggered after edit
}

export function useArtwork({ artworkId, isOpen, onClose, onUpdated }: UseArtworkParams) {
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

    let ignore = false;
    const fetchArtwork = async () => {
      setLoading(true);
      setError('');
      setIsEditing(false);
      try {
        const res = await window.fetch(`/api/artworks/${artworkId}`);
        if (!res.ok) throw new Error(t('modal.loadError'));
        const data = await res.json();
        if (ignore) return;
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
    return () => { ignore = true; };
  }, [artworkId, isOpen, session, t]);

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
        tags: editForm.tags.split(',').flatMap((t: string) => t.trim() ? [t.trim()] : [])
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

  return {
    session,
    locale,
    t,
    artwork,
    loading,
    error,
    isLiking,
    isLiked,
    commentText,
    setCommentText,
    isSubmittingComment,
    isEditing,
    setIsEditing,
    editForm,
    setEditForm,
    isSaving,
    isSaved,
    setIsSaved,
    isSavingAction,
    copyFeedback,
    showCollectionsModal,
    setShowCollectionsModal,
    showDeleteConfirm,
    setShowDeleteConfirm,
    isDeleting,
    isMounted,
    isOwner,
    handleLike,
    handleDelete,
    handleSave,
    handleShare,
    handleComment,
    handleSaveEdit,
  };
}
